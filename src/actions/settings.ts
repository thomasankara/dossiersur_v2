"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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
// Schemas
// ---------------------------------------------------------------------------

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Nom requis").max(100),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Mot de passe trop court (8 caractères minimum)"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function updateProfile(formData: FormData) {
  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
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

  // Update auth metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });

  if (authError) {
    return { error: "Erreur lors de la mise à jour" };
  }

  // Update profile table
  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from("ds_profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Erreur lors de la mise à jour du profil" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const parsed = updatePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
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

  // Verify current password before changing
  const { error: signInError } = await auth.supabase.auth.signInWithPassword({
    email: auth.user.email ?? "",
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return { error: "Mot de passe actuel incorrect" };
  }

  const { error } = await auth.supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    return { error: "Erreur lors du changement de mot de passe" };
  }

  return { success: true };
}

export async function deleteAccount() {
  let auth;
  try {
    auth = await requireAuth();
  } catch {
    return { error: "Non authentifié" };
  }

  // Sign out all sessions before deletion
  await auth.supabase.auth.signOut({ scope: "global" });

  // Delete user via admin (cascades to ds_profiles and all related data)
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);

  if (error) {
    return { error: "Erreur lors de la suppression du compte" };
  }

  redirect("/login");
}
