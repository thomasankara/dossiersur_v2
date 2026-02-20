import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditsCounterProps {
  credits: number;
  className?: string;
}

export function CreditsCounter({ credits, className }: CreditsCounterProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2",
        className,
      )}
    >
      <Coins className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">
        {credits} crédit{credits !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
