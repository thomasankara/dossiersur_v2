import { Shield, Sparkles } from "lucide-react";
import { PricingTable } from "@/components/billing/pricing-table";

export const metadata = {
  title: "Tarifs — DossierSûr",
  description: "Choisissez le pack de crédits adapté à vos besoins.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Tarifs simples, sans abonnement
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Achetez des crédits d&apos;analyse et utilisez-les quand vous en avez
          besoin. Pas d&apos;engagement.
        </p>
      </div>

      {/* Free tier */}
      <div className="mb-10 flex items-center justify-center gap-3 rounded-lg border border-dashed p-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <p className="text-sm">
          <span className="font-semibold">3 crédits offerts</span> à
          l&apos;inscription pour tester le service
        </p>
      </div>

      {/* Plans */}
      <PricingTable authenticated={false} />

      {/* Trust */}
      <div className="mt-16 text-center">
        <div className="mx-auto flex items-center justify-center gap-2 text-muted-foreground">
          <Shield className="h-5 w-5" />
          <p className="text-sm">
            Paiement sécurisé par Stripe. Vos documents sont analysés puis
            supprimés immédiatement (RGPD).
          </p>
        </div>
      </div>
    </div>
  );
}
