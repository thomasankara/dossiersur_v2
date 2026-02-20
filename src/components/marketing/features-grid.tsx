import {
  ShieldCheck,
  Link2,
  FileSearch,
  Zap,
  Lock,
  HeadphonesIcon,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Détection de fraude",
    description:
      "Analyse des métadonnées PDF, polices suspectes et outils de modification détectés.",
  },
  {
    icon: Link2,
    title: "Cross-validation",
    description:
      "Vérification croisée entre les documents : nom, adresse, revenus cohérents.",
  },
  {
    icon: FileSearch,
    title: "Tous types de documents",
    description:
      "Bulletins de paie, avis d\u2019imposition, CNI, passeport, contrat de travail, RIB...",
  },
  {
    icon: Zap,
    title: "Résultat en secondes",
    description:
      "Analyse complète en moins de 30 secondes par document. Pas d\u2019attente.",
  },
  {
    icon: Lock,
    title: "RGPD compliant",
    description:
      "Documents analysés puis supprimés immédiatement. Aucune donnée conservée.",
  },
  {
    icon: HeadphonesIcon,
    title: "Support réactif",
    description:
      "Une question ? Notre équipe répond rapidement par email.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="border-y bg-muted/30 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-center font-heading text-2xl font-bold sm:text-3xl">
          Tout ce dont vous avez besoin
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border bg-background p-6"
            >
              <feature.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
