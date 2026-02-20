import posthog from "posthog-js";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function trackSignup(method: string) {
  posthog.capture("auth_signup", { method });
}

export function trackLogin(method: string) {
  posthog.capture("auth_login", { method });
}

export function trackLogout() {
  posthog.capture("auth_logout");
  posthog.reset();
}

// ---------------------------------------------------------------------------
// Core Feature
// ---------------------------------------------------------------------------

export function trackDossierCreated() {
  posthog.capture("dossier_created");
}

export function trackDossierDeleted() {
  posthog.capture("dossier_deleted");
}

export function trackDocumentAnalyzed(docType: string) {
  posthog.capture("document_analyzed", { doc_type: docType });
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export function trackCheckoutStarted(plan: string, priceCents: number) {
  posthog.capture("payment_checkout_started", {
    plan,
    price_euros: priceCents / 100,
  });
}

export function trackPaymentCompleted(plan: string) {
  posthog.capture("payment_completed", { plan });
}

// ---------------------------------------------------------------------------
// Engagement
// ---------------------------------------------------------------------------

export function trackFeatureUsed(featureName: string) {
  posthog.capture("feature_used", { feature_name: featureName });
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export function identifyUser(userId: string) {
  posthog.identify(userId);
}
