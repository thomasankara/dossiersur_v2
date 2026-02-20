import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layouts/header";
import { PersonSection } from "@/components/dossier/person-section";
import { CrossValidation } from "@/components/dossier/cross-validation";
import { UploadZone } from "@/components/dossier/upload-zone";
import { CandidatDocuments } from "./candidat-documents";
import { getRoleLabel } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { DsCandidat, DsDocument, DsCrossValidation } from "@/types";

interface PageProps {
  params: Promise<{ id: string; cid: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { cid } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("ds_candidats")
    .select("nom, prenom, role")
    .eq("id", cid)
    .single();

  const name = data
    ? `${data.prenom ?? ""} ${data.nom ?? ""}`.trim() || getRoleLabel(data.role as string)
    : "Candidat";

  return { title: name };
}

export default async function CandidatDetailPage({ params }: PageProps) {
  const { id: dossierId, cid: candidatId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [candidatRes, documentsRes, crossValidationRes] = await Promise.all([
    supabase.from("ds_candidats").select("*").eq("id", candidatId).single(),
    supabase
      .from("ds_documents")
      .select("*")
      .eq("candidat_id", candidatId)
      .order("created_at", { ascending: false }),
    supabase
      .from("ds_cross_validations")
      .select("*")
      .eq("candidat_id", candidatId)
      .single(),
  ]);

  if (!candidatRes.data) notFound();

  const candidat = candidatRes.data as unknown as DsCandidat;
  const documents = (documentsRes.data ?? []) as unknown as DsDocument[];
  const crossValidation = (crossValidationRes.data as unknown as DsCrossValidation) ?? null;

  const candidatName =
    `${candidat.prenom ?? ""} ${candidat.nom ?? ""}`.trim() ||
    getRoleLabel(candidat.role);

  return (
    <>
      <Header>
        <div className="flex flex-1 items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8" aria-label="Retour au dossier">
            <Link href={`/dashboard/dossier/${dossierId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="truncate text-lg font-semibold">{candidatName}</h1>
          <span className="text-sm text-muted-foreground">
            {getRoleLabel(candidat.role)}
          </span>
        </div>
      </Header>
      <div className="flex-1 space-y-6 p-6">
        {/* Person info */}
        {documents.length > 0 && (
          <PersonSection
            person={documents.find((d) => d.person)?.person ?? null}
          />
        )}

        {/* Upload */}
        <UploadZone candidatId={candidatId} dossierId={dossierId} />

        {/* Documents with expanded checks */}
        <CandidatDocuments documents={documents} dossierId={dossierId} />

        {/* Cross-validation */}
        <CrossValidation crossValidation={crossValidation} />
      </div>
    </>
  );
}
