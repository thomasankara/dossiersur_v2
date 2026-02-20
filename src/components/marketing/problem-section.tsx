import { AlertTriangle } from "lucide-react";

const stats = [
  { value: "1 sur 5", label: "dossiers contient un faux document" },
  { value: "67%", label: "des propriétaires ne vérifient pas" },
  { value: "2 min", label: "pour analyser un document" },
];

export function ProblemSection() {
  return (
    <section className="border-y bg-muted/30 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-center gap-3">
          <AlertTriangle className="h-6 w-6 text-warning" />
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            La fraude locative est un vrai problème
          </h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-4xl font-bold text-primary">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
