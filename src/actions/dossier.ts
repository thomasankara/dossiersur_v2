"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createDossierSchema = z.object({
  name: z.string().min(1, "Nom du dossier requis").max(100),
  candidatRole: z.enum(["locataire", "garant"]),
  candidatNom: z.string().max(100).optional(),
  candidatPrenom: z.string().max(100).optional(),
});

const updateDossierSchema = z.object({
  dossierId: z.string().uuid(),
  name: z.string().min(1, "Nom du dossier requis").max(100),
});

const deleteDossierSchema = z.object({
  dossierId: z.string().uuid(),
});

const addCandidatSchema = z.object({
  dossierId: z.string().uuid(),
  role: z.enum(["locataire", "garant"]),
  nom: z.string().max(100).optional(),
  prenom: z.string().max(100).optional(),
});

const removeCandidatSchema = z.object({
  candidatId: z.string().uuid(),
  dossierId: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  return { supabase, user };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createDossier(formData: FormData) {
  const parsed = createDossierSchema.safeParse({
    name: formData.get("name"),
    candidatRole: formData.get("candidatRole"),
    candidatNom: formData.get("candidatNom") || undefined,
    candidatPrenom: formData.get("candidatPrenom") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    return { error: "Non authentifié" };
  }

  const { supabase, user } = auth;

  // Create dossier
  const { data: dossier, error: dossierError } = await supabase
    .from("ds_dossiers")
    .insert({ user_id: user.id, name: parsed.data.name })
    .select("id")
    .single();

  if (dossierError || !dossier) {
    return { error: "Erreur lors de la création du dossier" };
  }

  // Create first candidat
  const { error: candidatError } = await supabase.from("ds_candidats").insert({
    dossier_id: dossier.id,
    role: parsed.data.candidatRole,
    nom: parsed.data.candidatNom ?? null,
    prenom: parsed.data.candidatPrenom ?? null,
  });

  if (candidatError) {
    await supabase.from("ds_dossiers").delete().eq("id", dossier.id);
    return { error: "Erreur lors de l'ajout du candidat" };
  }

  redirect(`/dashboard/dossier/${dossier.id}`);
}

export async function updateDossier(formData: FormData) {
  const parsed = updateDossierSchema.safeParse({
    dossierId: formData.get("dossierId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    return { error: "Non authentifié" };
  }

  const { error } = await auth.supabase
    .from("ds_dossiers")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.dossierId);

  if (error) {
    return { error: "Erreur lors de la mise à jour" };
  }

  revalidatePath(`/dashboard/dossier/${parsed.data.dossierId}`);
  return { success: true };
}

export async function deleteDossier(formData: FormData) {
  const parsed = deleteDossierSchema.safeParse({
    dossierId: formData.get("dossierId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    return { error: "Non authentifié" };
  }

  const { error } = await auth.supabase
    .from("ds_dossiers")
    .delete()
    .eq("id", parsed.data.dossierId);

  if (error) {
    return { error: "Erreur lors de la suppression" };
  }

  redirect("/dashboard");
}

export async function addCandidat(formData: FormData) {
  const parsed = addCandidatSchema.safeParse({
    dossierId: formData.get("dossierId"),
    role: formData.get("role"),
    nom: formData.get("nom") || undefined,
    prenom: formData.get("prenom") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    return { error: "Non authentifié" };
  }

  const { error } = await auth.supabase.from("ds_candidats").insert({
    dossier_id: parsed.data.dossierId,
    role: parsed.data.role,
    nom: parsed.data.nom ?? null,
    prenom: parsed.data.prenom ?? null,
  });

  if (error) {
    return { error: "Erreur lors de l'ajout du candidat" };
  }

  revalidatePath(`/dashboard/dossier/${parsed.data.dossierId}`);
  return { success: true };
}

export async function removeCandidat(formData: FormData) {
  const parsed = removeCandidatSchema.safeParse({
    candidatId: formData.get("candidatId"),
    dossierId: formData.get("dossierId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    return { error: "Non authentifié" };
  }

  const { error } = await auth.supabase
    .from("ds_candidats")
    .delete()
    .eq("id", parsed.data.candidatId);

  if (error) {
    return { error: "Erreur lors de la suppression du candidat" };
  }

  revalidatePath(`/dashboard/dossier/${parsed.data.dossierId}`);
  return { success: true };
}
