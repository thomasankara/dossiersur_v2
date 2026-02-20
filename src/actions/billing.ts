"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { PLANS } from "@/lib/stripe/config";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import Stripe from "stripe";

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

const checkoutSchema = z.object({
  planKey: z.enum(["starter", "pro", "business"]),
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createCheckoutSession(formData: FormData) {
  const parsed = checkoutSchema.safeParse({
    planKey: formData.get("planKey"),
  });

  if (!parsed.success) {
    return { error: "Plan invalide" };
  }

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    return { error: "Non authentifié" };
  }

  const { supabase, user } = auth;
  const planKey = parsed.data.planKey;
  const plan = PLANS[planKey];

  // H7: Check priceId is configured
  if (!plan.priceId) {
    return { error: "Ce plan n'est pas encore disponible." };
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from("ds_profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profil introuvable" };
  }

  let stripeCustomerId = profile.stripe_customer_id as string | null;

  if (!stripeCustomerId) {
    const customer = await getStripe().customers.create({
      email: profile.email as string,
      metadata: { supabase_user_id: user.id },
    });

    stripeCustomerId = customer.id;

    // H1: Conditional update to prevent race condition on double-submit
    const admin = createAdminClient();
    const { data: updated } = await admin
      .from("ds_profiles")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", user.id)
      .is("stripe_customer_id", null)
      .select("stripe_customer_id")
      .single();

    // If another request already set it, use that one
    if (!updated) {
      const { data: existing } = await admin
        .from("ds_profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single();
      stripeCustomerId = existing?.stripe_customer_id as string;
    }
  }

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    metadata: {
      supabase_user_id: user.id,
      plan_key: planKey,
    },
    success_url: `${origin}/dashboard/billing?success=true`,
    cancel_url: `${origin}/dashboard/billing?canceled=true`,
  });

  if (!session.url) {
    return { error: "Erreur lors de la création de la session de paiement" };
  }

  redirect(session.url);
}

export async function createPortalSession() {
  let auth;
  try {
    auth = await requireAuth();
  } catch {
    return { error: "Non authentifié" };
  }

  const { supabase, user } = auth;

  const { data: profile } = await supabase
    .from("ds_profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return { error: "Aucun historique de paiement" };
  }

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id as string,
      return_url: `${origin}/dashboard/billing`,
    });

    redirect(session.url);
  } catch (err) {
    // redirect() throws a special Next.js error — rethrow it
    if (err instanceof Error && err.message === "NEXT_REDIRECT") {
      throw err;
    }
    if (err instanceof Stripe.errors.StripeError) {
      return { error: "Impossible d'ouvrir le portail de facturation." };
    }
    throw err;
  }
}
