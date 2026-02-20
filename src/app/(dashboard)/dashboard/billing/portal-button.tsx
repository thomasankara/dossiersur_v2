"use client";

import { useTransition } from "react";
import { createPortalSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function PortalButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await createPortalSession();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        "Ouvrir"
      )}
    </Button>
  );
}
