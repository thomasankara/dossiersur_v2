"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { getSafeRedirect } from "@/lib/utils/safe-redirect";
import { rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court (6 caractères minimum)"),
});

const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court (6 caractères minimum)"),
  fullName: z.string().min(1, "Nom requis"),
});

const resetSchema = z.object({
  email: z.string().email("Email invalide"),
});

export async function login(formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const { success: allowed } = rateLimit(`login:${ip}`, { windowMs: 60_000, maxRequests: 5 });
  if (!allowed) {
    return { error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email ou mot de passe incorrect" };
  }

  const redirectTo = formData.get("redirect") as string | null;
  redirect(getSafeRedirect(redirectTo));
}

export async function signup(formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const { success: allowed } = rateLimit(`signup:${ip}`, { windowMs: 60_000, maxRequests: 5 });
  if (!allowed) {
    return { error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Un compte existe déjà avec cet email" };
    }
    return { error: "Erreur lors de l'inscription" };
  }

  redirect("/dashboard");
}

export async function loginWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return { error: "Erreur de connexion Google" };
  }

  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const { success: allowed } = rateLimit(`reset:${ip}`, { windowMs: 60_000, maxRequests: 3 });
  if (!allowed) {
    return { error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const parsed = resetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${origin}/auth/callback?next=/settings` },
  );

  if (error) {
    return { error: "Erreur lors de l'envoi du lien" };
  }

  return { success: "Lien de réinitialisation envoyé par email" };
}
