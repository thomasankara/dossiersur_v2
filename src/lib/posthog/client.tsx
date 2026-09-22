"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { getConsent } from "@/lib/posthog/consent";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;

    if (
      process.env.NODE_ENV !== "production" &&
      !POSTHOG_KEY.startsWith("phc_")
    ) {
      console.warn(
        "[PostHog] NEXT_PUBLIC_POSTHOG_KEY should start with \"phc_\" (project key). Events are not captured with any other key type.",
      );
    }

    const consent = getConsent();

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: "history_change",
      capture_pageleave: true,
      persistence: consent === "granted" ? "localStorage+cookie" : "memory",
      opt_out_capturing_by_default: consent !== "granted",
      respect_dnt: true,
    });
  }, []);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
