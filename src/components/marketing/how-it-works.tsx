import { Upload, Cpu, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "1. Uploadez",
    description:
      "Glissez-déposez les documents du candidat : bulletins de paie, avis d\u2019imposition, CNI...",
  },
  {
    icon: Cpu,
    title: "2. Analyse automatique",
    description:
      "Notre IA analyse chaque document : métadonnées PDF, cohérence des données, détection de falsification.",
  },
  {
    icon: CheckCircle,
    title: "3. Résultat immédiat",
    description:
      "Score de confiance, alertes détaillées et cross-validation entre les documents du dossier.",
  },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-center font-heading text-2xl font-bold sm:text-3xl">
          Comment ça marche
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
