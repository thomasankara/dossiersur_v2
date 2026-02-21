import { vi } from "vitest";

export function createMockStripe() {
  return {
    customers: {
      create: vi.fn().mockResolvedValue({ id: "cus_test123" }),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: "cs_test123",
          url: "https://checkout.stripe.com/session",
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
    webhooks: {
      constructEvent: vi.fn().mockReturnValue({
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
          },
        },
      }),
    },
  };
}
