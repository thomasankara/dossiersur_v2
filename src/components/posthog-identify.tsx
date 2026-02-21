"use client";

import { useEffect } from "react";
import { identifyUser } from "@/lib/posthog/events";

export function PostHogIdentify({ userId }: { userId: string }) {
  useEffect(() => {
    identifyUser(userId);
  }, [userId]);

  return null;
}
