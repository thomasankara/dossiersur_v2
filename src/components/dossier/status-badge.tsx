import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStatusLabel } from "@/lib/utils/format";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle; variant: string; colorClass: string }
> = {
  ok: { icon: CheckCircle, variant: "outline", colorClass: "border-valid/30 text-valid bg-valid/10" },
  complet: { icon: Shield, variant: "outline", colorClass: "border-valid/30 text-valid bg-valid/10" },
  warning: { icon: AlertTriangle, variant: "outline", colorClass: "border-warning/30 text-warning bg-warning/10" },
  error: { icon: XCircle, variant: "outline", colorClass: "border-destructive/30 text-destructive bg-destructive/10" },
  alerte: { icon: XCircle, variant: "outline", colorClass: "border-destructive/30 text-destructive bg-destructive/10" },
  en_cours: { icon: Clock, variant: "outline", colorClass: "border-muted-foreground/30 text-muted-foreground bg-muted" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig["en_cours"]!;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(config.colorClass, className)}
    >
      <Icon className="h-3 w-3" />
      {getStatusLabel(status)}
    </Badge>
  );
}
