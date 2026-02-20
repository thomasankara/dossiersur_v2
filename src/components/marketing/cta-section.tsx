import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="border-t bg-primary/5 px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <Shield className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h2 className="font-heading text-2xl font-bold sm:text-3xl">
          Protégez-vous contre la fraude locative
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Créez votre compte gratuitement et analysez vos 3 premiers documents
          sans engagement.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/signup">Créer mon compte gratuit</Link>
        </Button>
      </div>
    </section>
  );
}
