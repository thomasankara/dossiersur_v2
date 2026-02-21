import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildFormData } from "@/__tests__/helpers/form-data";

// Mock PLANS with priceIds set (these read env vars at module load time)
vi.mock("@/lib/stripe/config", () => ({
  PLANS: {
    starter: { name: "Starter", credits: 10, price: 990, priceId: "price_starter_test", features: ["10 analyses"] },
    pro: { name: "Pro", credits: 50, price: 2990, priceId: "price_pro_test", popular: true, features: ["50 analyses"] },
    business: { name: "Business", credits: 200, price: 7990, priceId: "price_business_test", features: ["200 analyses"] },
  },
  PLAN_KEYS: ["starter", "pro", "business"],
}));

// --- Mock Supabase ---
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

function makeChain(overrides: {
  singleResult?: { data: unknown; error: unknown };
} = {}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  ["select", "update", "eq", "is", "single"].forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  if (overrides.singleResult) {
    chain["single"]!.mockResolvedValue(overrides.singleResult);
  }
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
      auth: { getUser: mockGetUser },
    }),
  ),
}));

// --- Mock Admin ---
const mockAdminFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

// --- Mock Stripe ---
const mockStripe = {
  customers: {
    create: vi.fn().mockResolvedValue({ id: "cus_test" }),
  },
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue({
        id: "cs_test",
        url: "https://checkout.stripe.com/test",
      }),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn().mockResolvedValue({
        url: "https://billing.stripe.com/portal",
      }),
    },
  },
};

vi.mock("@/lib/stripe/client", () => ({
  getStripe: vi.fn(() => mockStripe),
}));

import { createCheckoutSession, createPortalSession } from "./billing";

describe("createCheckoutSession()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    // Default: profile with no stripe_customer_id
    mockFrom.mockReturnValue(
      makeChain({
        singleResult: {
          data: { stripe_customer_id: null, email: "test@example.com" },
          error: null,
        },
      }),
    );
    // Admin update succeeds
    mockAdminFrom.mockReturnValue(
      makeChain({
        singleResult: {
          data: { stripe_customer_id: "cus_test" },
          error: null,
        },
      }),
    );
  });

  it("returns error on invalid plan", async () => {
    const fd = buildFormData({ planKey: "invalid" });
    const result = await createCheckoutSession(fd);
    expect(result).toEqual({ error: "Plan invalide" });
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const fd = buildFormData({ planKey: "starter" });
    const result = await createCheckoutSession(fd);
    expect(result).toEqual({ error: "Non authentifié" });
  });

  it("returns error when profile not found", async () => {
    mockFrom.mockReturnValue(
      makeChain({ singleResult: { data: null, error: null } }),
    );
    const fd = buildFormData({ planKey: "starter" });
    const result = await createCheckoutSession(fd);
    expect(result).toEqual({ error: "Profil introuvable" });
  });

  it("creates Stripe customer if none exists", async () => {
    const fd = buildFormData({ planKey: "starter" });
    await expect(createCheckoutSession(fd)).rejects.toThrow("NEXT_REDIRECT:");
    expect(mockStripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@example.com" }),
    );
  });

  it("skips customer creation if already exists", async () => {
    mockFrom.mockReturnValue(
      makeChain({
        singleResult: {
          data: { stripe_customer_id: "cus_existing", email: "test@example.com" },
          error: null,
        },
      }),
    );
    const fd = buildFormData({ planKey: "pro" });
    await expect(createCheckoutSession(fd)).rejects.toThrow("NEXT_REDIRECT:");
    expect(mockStripe.customers.create).not.toHaveBeenCalled();
  });

  it("handles race condition on customer creation", async () => {
    // Admin update returns null (another request already set it)
    let adminFromCallCount = 0;
    mockAdminFrom.mockImplementation(() => {
      adminFromCallCount++;
      if (adminFromCallCount === 1) {
        return makeChain({ singleResult: { data: null, error: null } });
      }
      return makeChain({
        singleResult: { data: { stripe_customer_id: "cus_other" }, error: null },
      });
    });

    const fd = buildFormData({ planKey: "starter" });
    await expect(createCheckoutSession(fd)).rejects.toThrow("NEXT_REDIRECT:");
  });

  it("redirects to checkout URL", async () => {
    const fd = buildFormData({ planKey: "starter" });
    await expect(createCheckoutSession(fd)).rejects.toThrow(
      "NEXT_REDIRECT:https://checkout.stripe.com/test",
    );
  });

  it("returns error if checkout session has no URL", async () => {
    mockStripe.checkout.sessions.create.mockResolvedValueOnce({ id: "cs_test", url: null });
    const fd = buildFormData({ planKey: "starter" });
    const result = await createCheckoutSession(fd);
    expect(result).toEqual({ error: "Erreur lors de la création de la session de paiement" });
  });
});

describe("createPortalSession()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const result = await createPortalSession();
    expect(result).toEqual({ error: "Non authentifié" });
  });

  it("returns error when no stripe_customer_id", async () => {
    mockFrom.mockReturnValue(
      makeChain({ singleResult: { data: { stripe_customer_id: null }, error: null } }),
    );
    const result = await createPortalSession();
    expect(result).toEqual({ error: "Aucun historique de paiement" });
  });

  it("redirects to portal URL", async () => {
    mockFrom.mockReturnValue(
      makeChain({ singleResult: { data: { stripe_customer_id: "cus_test" }, error: null } }),
    );
    await expect(createPortalSession()).rejects.toThrow(
      "NEXT_REDIRECT:https://billing.stripe.com/portal",
    );
  });
});
