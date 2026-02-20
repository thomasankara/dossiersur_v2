"use client";

import { useTransition } from "react";
import { createCheckoutSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PlanKey } from "@/lib/stripe/config";

interface CheckoutButtonProps {
  planKey: PlanKey;
  className?: string;
  variant?: "default" | "outline";
}

export function CheckoutButton({
  planKey,
  className,
  variant = "default",
}: CheckoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("planKey", planKey);
      const result = await createCheckoutSession(formData);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant={variant}
      className={className}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirection...
        </>
      ) : (
        "Acheter"
      )}
    </Button>
  );
}
