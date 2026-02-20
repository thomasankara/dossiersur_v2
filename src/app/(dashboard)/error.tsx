"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
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
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <AlertTriangle className="mb-6 h-12 w-12 text-destructive" />
      <h2 className="font-heading text-2xl font-bold">
        Une erreur est survenue
      </h2>
      <p className="mt-3 max-w-md text-muted-foreground">
        Impossible de charger cette page. Veuillez réessayer.
      </p>
      <Button className="mt-6" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
