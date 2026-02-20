export const PLANS = {
  starter: {
    name: "Starter",
    description: "10 analyses de documents",
    credits: 10,
    price: 990,
    priceLabel: "9,90 \u20ac",
    priceId: process.env.STRIPE_PRICE_STARTER ?? "",
    features: [
      "10 analyses de documents",
      "Tous types de documents",
      "Cross-validation automatique",
      "Rapport de fraude",
    ],
  },
  pro: {
    name: "Pro",
    description: "50 analyses de documents",
    credits: 50,
    price: 2990,
    priceLabel: "29,90 \u20ac",
    priceId: process.env.STRIPE_PRICE_PRO ?? "",
    popular: true,
    features: [
      "50 analyses de documents",
      "Tous types de documents",
      "Cross-validation automatique",
      "Rapport de fraude",
      "Support prioritaire",
    ],
  },
  business: {
    name: "Business",
    description: "200 analyses de documents",
    credits: 200,
    price: 7990,
    priceLabel: "79,90 \u20ac",
    priceId: process.env.STRIPE_PRICE_BUSINESS ?? "",
    features: [
      "200 analyses de documents",
      "Tous types de documents",
      "Cross-validation automatique",
      "Rapport de fraude",
      "Support prioritaire",
      "API acc\u00e8s",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];
