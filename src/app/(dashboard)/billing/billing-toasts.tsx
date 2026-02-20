"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BillingToastsProps {
  success: boolean;
  canceled: boolean;
}

export function BillingToasts({ success, canceled }: BillingToastsProps) {
  const router = useRouter();

  useEffect(() => {
    if (success) {
      toast.success("Paiement réussi ! Vos crédits ont été ajoutés.");
      router.replace("/dashboard/billing");
    }
    if (canceled) {
      toast.info("Paiement annulé.");
      router.replace("/dashboard/billing");
    }
  }, [success, canceled, router]);

  return null;
}
