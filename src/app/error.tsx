"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <AlertTriangle className="mb-6 h-16 w-16 text-destructive" />
      <h1 className="font-heading text-3xl font-bold">
        Une erreur est survenue
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Quelque chose s&apos;est mal passé. Veuillez réessayer ou revenir plus
        tard.
      </p>
      <Button className="mt-8" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
