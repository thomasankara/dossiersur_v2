"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { getConsent, setConsent } from "@/lib/posthog/consent";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function ConsentBanner() {
  const decision = useSyncExternalStore(
    subscribe,
    getConsent,
    () => null,
  );
  const [dismissed, setDismissed] = useState(false);

  if (!POSTHOG_KEY || decision !== null || dismissed) return null;

  function accept() {
    setConsent("granted");
    posthog.set_config({ persistence: "localStorage+cookie" });
    posthog.opt_in_capturing();
    setDismissed(true);
  }

  function decline() {
    setConsent("denied");
    posthog.opt_out_capturing();
    setDismissed(true);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies analytiques"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Nous utilisons des cookies analytiques (PostHog, serveurs UE) pour
          améliorer le service. Vous pouvez les refuser.{" "}
          <Link href="/confidentialite" className="underline">
            En savoir plus
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <Button variant="outline" size="sm" onClick={decline}>
            Refuser
          </Button>
          <Button size="sm" onClick={accept}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
