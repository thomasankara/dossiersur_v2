"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { computeSha256 } from "@/lib/utils/hash";
import { verifyMimeType } from "@/lib/utils/mime";
import { sanitizeFilename } from "@/lib/utils/sanitize";
import { DOC_TYPE_VALUES } from "@/lib/constants/doc-types";
import { analyzeDocument, crossValidateDocuments, AnalysisApiError } from "@/lib/analysis/client";
import type {
  DsDocument,
  ValidationResult,
  PersonExtraction,
  CrossValidateDocumentInput,
} from "@/types";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const uploadSchema = z.object({
  candidatId: z.string().uuid(),
  dossierId: z.string().uuid(),
  docType: z.enum(DOC_TYPE_VALUES),
});

const deleteDocSchema = z.object({
  documentId: z.string().uuid(),
  dossierId: z.string().uuid(),
  candidatId: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Upload + Analyze
// ---------------------------------------------------------------------------

export async function uploadAndAnalyzeDocument(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Aucun fichier sélectionné" };
  }

  // Validate file type (client-reported) & size
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Type de fichier non supporté. PDF, JPEG, PNG ou WebP uniquement." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Fichier trop volumineux (max 20 Mo)" };
  }

  const parsed = uploadSchema.safeParse({
    candidatId: formData.get("candidatId"),
    dossierId: formData.get("dossierId"),
    docType: formData.get("docType"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  // Verify magic bytes (server-side MIME validation)
  const buffer = await file.arrayBuffer();
  if (!verifyMimeType(buffer, file.type)) {
    return { error: "Le contenu du fichier ne correspond pas à son type déclaré" };
  }

  // Verify candidat belongs to dossier (M1)
  const { data: candidatCheck } = await supabase
    .from("ds_candidats")
    .select("id")
    .eq("id", parsed.data.candidatId)
    .eq("dossier_id", parsed.data.dossierId)
    .single();

  if (!candidatCheck) {
    return { error: "Candidat invalide pour ce dossier" };
  }

  // Atomic credit decrement (C3 — prevents race condition)
  const { data: decremented } = await supabase.rpc("ds_decrement_credit", {
    p_user_id: user.id,
  });

  if (!decremented) {
    return { error: "Crédits insuffisants. Achetez des crédits pour continuer." };
  }

  // Compute file hash for dedup
  const fileHash = await computeSha256(buffer);

  // Check duplicate
  const { data: existing } = await supabase
    .from("ds_documents")
    .select("id")
    .eq("file_hash", fileHash)
    .eq("dossier_id", parsed.data.dossierId)
    .limit(1);

  const admin = createAdminClient();

  if (existing && existing.length > 0) {
    // Refund credit atomically since we're not analyzing
    await admin.rpc("ds_refund_credit", { p_user_id: user.id });
    return { error: "Ce document a déjà été analysé dans ce dossier" };
  }

  // Upload to Supabase Storage using admin client (bypasses RLS on storage)
  const safeFilename = sanitizeFilename(file.name);
  const storagePath = `${user.id}/${parsed.data.dossierId}/${crypto.randomUUID()}-${safeFilename}`;

  const { error: uploadError } = await admin.storage
    .from("ds-documents")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: "Erreur lors de l'upload du fichier" };
  }

  try {
    // Get signed URL for the Python API
    const { data: signedUrlData, error: signedUrlError } = await admin.storage
      .from("ds-documents")
      .createSignedUrl(storagePath, 300); // 5 min

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error("Failed to create signed URL");
    }

    // Call Python analysis API
    const analysisResult = await analyzeDocument({
      document_url: signedUrlData.signedUrl,
      document_type: parsed.data.docType,
      filename: safeFilename,
    });

    // Build validation result
    const validationResult: ValidationResult = {
      checks: analysisResult.checks,
      overall_status: analysisResult.overall_status,
      confidence_score: analysisResult.confidence_score,
      forensic: analysisResult.forensic,
    };

    const person: PersonExtraction | null = analysisResult.person
      ? {
          nom: analysisResult.person.nom,
          prenom: analysisResult.person.prenom,
          date_naissance: analysisResult.person.date_naissance,
          source: analysisResult.person.source,
          confidence: analysisResult.person.confidence,
        }
      : null;

    // Insert document record
    const { data: doc, error: docError } = await supabase
      .from("ds_documents")
      .insert({
        candidat_id: parsed.data.candidatId,
        dossier_id: parsed.data.dossierId,
        filename: safeFilename,
        file_hash: fileHash,
        doc_type: parsed.data.docType,
        classified_type: analysisResult.classified_type,
        confidence_score: analysisResult.confidence_score,
        overall_status: analysisResult.overall_status,
        person,
        validation_result: validationResult,
      })
      .select("id")
      .single();

    if (docError || !doc) {
      throw new Error("Failed to save document record");
    }

    // Auto-fill candidat name if empty
    if (person?.nom || person?.prenom) {
      const { data: candidat } = await supabase
        .from("ds_candidats")
        .select("nom, prenom")
        .eq("id", parsed.data.candidatId)
        .single();

      if (candidat && !candidat.nom && !candidat.prenom) {
        await supabase
          .from("ds_candidats")
          .update({
            nom: person.nom ?? null,
            prenom: person.prenom ?? null,
            date_naissance: person.date_naissance ?? null,
          })
          .eq("id", parsed.data.candidatId);
      }
    }

    // Cross-validation if candidat has ≥2 docs
    await runCrossValidation(supabase, parsed.data.candidatId, parsed.data.dossierId);

    // Recalculate dossier score
    await recalculateDossierScore(supabase, parsed.data.dossierId);

    // Record billing event via admin client (H5 — no INSERT policy for auth users)
    const { error: billingError } = await admin.from("ds_billing_events").insert({
      user_id: user.id,
      type: "analysis",
      credits_added: -1,
      metadata: {
        document_id: doc.id,
        doc_type: parsed.data.docType,
      },
    });

    if (billingError) {
      console.error("Failed to record billing event:", billingError.message);
    }

    revalidatePath(`/dashboard/dossier/${parsed.data.dossierId}`);
    return { success: true, documentId: doc.id };
  } catch (err) {
    if (err instanceof AnalysisApiError) {
      return {
        error:
          err.code === "timeout"
            ? "L'analyse a pris trop de temps. Réessayez."
            : err.code === "network_error"
              ? "Service d'analyse indisponible. Réessayez plus tard."
              : "Le service d'analyse a retourné une erreur. Réessayez ou contactez le support.",
      };
    }
    return { error: "Erreur lors de l'analyse du document" };
  } finally {
    // RGPD: delete file from storage after analysis
    await admin.storage.from("ds-documents").remove([storagePath]);
  }
}

// ---------------------------------------------------------------------------
// Delete document
// ---------------------------------------------------------------------------

export async function deleteDocument(formData: FormData) {
  const parsed = deleteDocSchema.safeParse({
    documentId: formData.get("documentId"),
    dossierId: formData.get("dossierId"),
    candidatId: formData.get("candidatId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const { error } = await supabase
    .from("ds_documents")
    .delete()
    .eq("id", parsed.data.documentId);

  if (error) {
    return { error: "Erreur lors de la suppression du document" };
  }

  // Re-run cross-validation or remove if <2 docs remain
  const { data: remainingDocs } = await supabase
    .from("ds_documents")
    .select("id")
    .eq("candidat_id", parsed.data.candidatId);

  if (!remainingDocs || remainingDocs.length < 2) {
    await supabase
      .from("ds_cross_validations")
      .delete()
      .eq("candidat_id", parsed.data.candidatId);
  } else {
    await runCrossValidation(supabase, parsed.data.candidatId, parsed.data.dossierId);
  }

  await recalculateDossierScore(supabase, parsed.data.dossierId);

  revalidatePath(`/dashboard/dossier/${parsed.data.dossierId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Helpers (private)
// ---------------------------------------------------------------------------

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function runCrossValidation(
  supabase: SupabaseClient,
  candidatId: string,
  dossierId: string,
) {
  const { data: docs } = await supabase
    .from("ds_documents")
    .select("id, classified_type, person, validation_result")
    .eq("candidat_id", candidatId);

  if (!docs || docs.length < 2) return;

  try {
    const documents: CrossValidateDocumentInput[] = docs.map(
      (d: Pick<DsDocument, "id" | "classified_type" | "person" | "validation_result">) => ({
        document_id: d.id,
        classified_type: d.classified_type ?? "unknown",
        person: d.person,
        checks: d.validation_result?.checks ?? [],
      }),
    );

    const result = await crossValidateDocuments({ documents });

    await supabase
      .from("ds_cross_validations")
      .upsert(
        {
          candidat_id: candidatId,
          dossier_id: dossierId,
          checks: result.checks,
          overall_status: result.overall_status,
          confidence_score: result.confidence_score,
          completeness: result.completeness,
          summary: result.summary,
        },
        { onConflict: "candidat_id" },
      );
  } catch {
    // Cross-validation is non-blocking
  }
}

async function recalculateDossierScore(
  supabase: SupabaseClient,
  dossierId: string,
) {
  const { data: docs } = await supabase
    .from("ds_documents")
    .select("confidence_score, overall_status")
    .eq("dossier_id", dossierId)
    .not("confidence_score", "is", null);

  if (!docs || docs.length === 0) {
    await supabase
      .from("ds_dossiers")
      .update({ overall_score: null, status: "en_cours" })
      .eq("id", dossierId);
    return;
  }

  const scores = docs.map((d) => d.confidence_score as number);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // M4: status based on document statuses, not just score
  const hasError = docs.some((d) => d.overall_status === "error");
  const status = hasError ? "alerte" : "complet";

  await supabase
    .from("ds_dossiers")
    .update({ overall_score: avg, status })
    .eq("id", dossierId);
}
