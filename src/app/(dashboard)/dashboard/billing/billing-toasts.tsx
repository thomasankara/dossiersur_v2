"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trackPaymentCompleted } from "@/lib/posthog/events";

interface BillingToastsProps {
  success: boolean;
  canceled: boolean;
  plan?: string;
}

export function BillingToasts({ success, canceled, plan }: BillingToastsProps) {
  const router = useRouter();

  useEffect(() => {
    if (success) {
      toast.success("Paiement réussi ! Vos crédits ont été ajoutés.");
      trackPaymentCompleted(plan ?? "unknown");
      router.replace("/dashboard/billing");
    }
    if (canceled) {
      toast.info("Paiement annulé.");
      router.replace("/dashboard/billing");
    }
  }, [success, canceled, router, plan]);

  return null;
}
