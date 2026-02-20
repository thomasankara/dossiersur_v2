import { redirect } from "next/navigation";
import { Coins, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layouts/header";
import { PricingTable } from "@/components/billing/pricing-table";
import { CreditsCounter } from "@/components/billing/credits-counter";
import { BillingHistory } from "@/components/billing/billing-history";
import { PortalButton } from "./portal-button";
import { BillingToasts } from "./billing-toasts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DsBillingEvent } from "@/types";

export const metadata = { title: "Facturation" };

interface PageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function BillingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, eventsRes] = await Promise.all([
    supabase
      .from("ds_profiles")
      .select("plan, credits_remaining, stripe_customer_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("ds_billing_events")
      .select("id, type, plan, credits_added, amount_cents, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const profile = profileRes.data;
  const events = (eventsRes.data ?? []) as unknown as DsBillingEvent[];

  if (!profile) redirect("/login");

  const credits = profile.credits_remaining as number;
  const plan = profile.plan as string;
  const hasStripe = !!profile.stripe_customer_id;

  // M4: Validate success toast against actual billing event
  const hasRecentPurchase =
    params.success === "true" &&
    events.some((e) => e.type === "purchase");

  return (
    <>
      <Header>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-lg font-semibold">Facturation</h1>
          <CreditsCounter credits={credits} />
        </div>
      </Header>
      <div className="flex-1 space-y-8 p-6">
        {/* Toasts for success/canceled */}
        <BillingToasts
          success={hasRecentPurchase}
          canceled={params.canceled === "true"}
        />

        {/* Credits overview */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              Crédits disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{credits}</p>
            <p className="mt-1 text-xs text-muted-foreground capitalize">
              Plan : {plan}
            </p>
          </CardContent>
        </Card>

        {/* Buy credits */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Acheter des crédits</h2>
          <PricingTable authenticated />
        </div>

        {/* Customer portal */}
        {hasStripe && (
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Gérer mes paiements</p>
              <p className="text-xs text-muted-foreground">
                Factures, moyens de paiement, historique Stripe
              </p>
            </div>
            <PortalButton />
          </div>
        )}

        {/* History */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Historique</h2>
          <BillingHistory events={events} />
        </div>
      </div>
    </>
  );
}
