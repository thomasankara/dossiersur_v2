import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock rate limit ---
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 99 })),
}));

// --- Mock Stripe ---
const mockConstructEvent = vi.fn();
vi.mock("@/lib/stripe/client", () => ({
  getStripe: vi.fn(() => ({
    webhooks: { constructEvent: mockConstructEvent },
  })),
}));

// --- Mock Admin Supabase ---
const mockAdminFrom = vi.fn();
const mockAdminRpc = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
    rpc: mockAdminRpc,
  })),
}));

// --- Mock PLANS ---
vi.mock("@/lib/stripe/config", () => ({
  PLANS: {
    starter: { credits: 10 },
    pro: { credits: 50 },
    business: { credits: 200 },
  },
}));

import { POST } from "./route";
import { rateLimit } from "@/lib/rate-limit";

function makeRequest(body: string, sig = "valid-sig") {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers: {
      "stripe-signature": sig,
      "x-forwarded-for": "1.2.3.4",
    },
  });
}

function makeChain(overrides: { maybeSingleResult?: { data: unknown; error: unknown } } = {}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  ["select", "insert", "update", "eq", "single", "maybeSingle"].forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  if (overrides.maybeSingleResult) {
    chain["maybeSingle"]!.mockResolvedValue(overrides.maybeSingleResult);
  }
  Object.defineProperty(chain, "then", {
    value: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
    enumerable: false,
    configurable: true,
  });
  return chain;
}

function makeCheckoutEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_test123",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test123",
        payment_status: "paid",
        amount_total: 990,
        metadata: {
          supabase_user_id: "user-123",
          plan_key: "starter",
        },
        ...overrides,
      },
    },
  };
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mockConstructEvent.mockReturnValue(makeCheckoutEvent());
    mockAdminRpc.mockResolvedValue({ data: true, error: null });
    // Default: no existing billing event (idempotency check)
    mockAdminFrom.mockReturnValue(
      makeChain({ maybeSingleResult: { data: null, error: null } }),
    );
  });

  it("returns 500 if WEBHOOK_SECRET is not set", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(makeRequest("body"));
    expect(res.status).toBe(500);
  });

  it("returns 400 if stripe-signature is missing", async () => {
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "body",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing signature" });
  });

  it("returns 400 if signature is invalid", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    const res = await POST(makeRequest("body", "bad-sig"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid signature" });
  });

  it("returns 200 for unhandled event type", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_test",
      type: "payment_intent.succeeded",
      data: { object: {} },
    });
    const res = await POST(makeRequest("body"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });

  it("processes checkout.session.completed with paid status", async () => {
    const res = await POST(makeRequest("body"));
    expect(res.status).toBe(200);
    expect(mockAdminRpc).toHaveBeenCalledWith("ds_add_credits", {
      p_user_id: "user-123",
      p_credits: 10,
    });
  });

  it("skips checkout.session.completed if payment_status is not paid", async () => {
    mockConstructEvent.mockReturnValue(
      makeCheckoutEvent({ payment_status: "unpaid" }),
    );
    const res = await POST(makeRequest("body"));
    expect(res.status).toBe(200);
    expect(mockAdminRpc).not.toHaveBeenCalled();
  });

  it("skips if billing event already exists (idempotency)", async () => {
    mockAdminFrom.mockReturnValue(
      makeChain({ maybeSingleResult: { data: { id: "existing" }, error: null } }),
    );
    const res = await POST(makeRequest("body"));
    expect(res.status).toBe(200);
    expect(mockAdminRpc).not.toHaveBeenCalled();
  });

  it("returns 500 if ds_add_credits RPC fails", async () => {
    mockAdminRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "RPC failed" },
    });
    const res = await POST(makeRequest("body"));
    expect(res.status).toBe(500);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockReturnValueOnce({ success: false, remaining: 0 });
    const res = await POST(makeRequest("body"));
    expect(res.status).toBe(429);
  });

  it("skips if metadata has invalid plan_key", async () => {
    mockConstructEvent.mockReturnValue(
      makeCheckoutEvent({ metadata: { supabase_user_id: "user-123", plan_key: "invalid" } }),
    );
    const res = await POST(makeRequest("body"));
    expect(res.status).toBe(200);
    expect(mockAdminRpc).not.toHaveBeenCalled();
  });
});
