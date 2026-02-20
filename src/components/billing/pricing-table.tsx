import { PLANS, PLAN_KEYS } from "@/lib/stripe/config";
import { PricingCard } from "./pricing-card";
import { CheckoutButton } from "./checkout-button";

interface PricingTableProps {
  /** When false, show a generic CTA link instead of CheckoutButton */
  authenticated?: boolean;
}

export function PricingTable({ authenticated = true }: PricingTableProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLAN_KEYS.map((key) => {
        const plan = PLANS[key];
        return (
          <PricingCard
            key={key}
            name={plan.name}
            priceLabel={plan.priceLabel}
            description={plan.description}
            features={plan.features}
            popular={"popular" in plan && plan.popular === true}
          >
            {authenticated ? (
              <CheckoutButton
                planKey={key}
                className="w-full"
                variant={"popular" in plan && plan.popular === true ? "default" : "outline"}
              />
            ) : (
              <a
                href="/signup"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Commencer
              </a>
            )}
          </PricingCard>
        );
      })}
    </div>
  );
}
