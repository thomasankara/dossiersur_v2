import { cn } from "@/lib/utils";
import { getScoreColor, getScoreBgColor } from "@/lib/utils/format";

interface ScoreBadgeProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-lg font-semibold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium",
        getScoreBgColor(score),
        getScoreColor(score),
        sizeClasses[size],
        className,
      )}
    >
      {score !== null ? score : "—"}
    </div>
  );
}
