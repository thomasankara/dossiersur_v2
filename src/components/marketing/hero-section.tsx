import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>3 analyses offertes à l&apos;inscription</span>
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-6xl">
          Vérifiez vos dossiers locatifs{" "}
          <span className="text-primary">en quelques secondes</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          DossierSûr détecte automatiquement les fraudes documentaires dans les
          dossiers de location : bulletins de paie, avis d&apos;imposition, pièces
          d&apos;identité et plus.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">
              <Shield className="mr-2 h-5 w-5" />
              Essayer gratuitement
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/pricing">Voir les tarifs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
