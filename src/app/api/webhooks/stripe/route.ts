import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanKey } from "@/lib/stripe/config";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success: allowed } = rateLimit(`webhook:${ip}`, { windowMs: 60_000, maxRequests: 100 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        await handleCheckoutCompleted(session);
      }
    }

    if (event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      await handleCheckoutCompleted(session);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const planKey = session.metadata?.plan_key as PlanKey | undefined;

  if (!userId || !planKey || !(planKey in PLANS)) return;

  // Derive credits from server-side config, not metadata
  const credits = PLANS[planKey].credits;

  const admin = createAdminClient();

  // Idempotency guard — check before any write
  const { data: existing } = await admin
    .from("ds_billing_events")
    .select("id")
    .eq("stripe_event_id", session.id)
    .maybeSingle();

  if (existing) return;

  // Add credits atomically
  const { error: creditsError } = await admin.rpc("ds_add_credits", {
    p_user_id: userId,
    p_credits: credits,
  });

  if (creditsError) {
    throw new Error(`ds_add_credits failed: ${creditsError.message}`);
  }

  // Update plan
  await admin
    .from("ds_profiles")
    .update({ plan: planKey })
    .eq("id", userId);

  // Record billing event
  const { error: insertError } = await admin.from("ds_billing_events").insert({
    user_id: userId,
    type: "purchase",
    stripe_event_id: session.id,
    plan: planKey,
    credits_added: credits,
    amount_cents: session.amount_total ?? null,
  });

  if (insertError) {
    throw new Error(`ds_billing_events insert failed: ${insertError.message}`);
  }
}
