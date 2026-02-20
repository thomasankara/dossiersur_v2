import { HeroSection } from "@/components/marketing/hero-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { PricingTable } from "@/components/billing/pricing-table";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";

export const metadata = {
  title: "DossierSûr — Vérification de dossiers locatifs",
  description:
    "Détectez les fraudes documentaires dans les dossiers de location en quelques secondes. Analyse automatique des bulletins de paie, CNI, avis d\u2019imposition.",
  openGraph: {
    title: "DossierSûr — Vérification de dossiers locatifs",
    description:
      "Détectez les fraudes documentaires dans les dossiers de location en quelques secondes.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <HowItWorks />
      <FeaturesGrid />

      {/* Pricing */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center font-heading text-2xl font-bold sm:text-3xl">
            Tarifs simples, sans abonnement
          </h2>
          <PricingTable authenticated={false} />
        </div>
      </section>

      <FaqSection />
      <CtaSection />
    </>
  );
}
