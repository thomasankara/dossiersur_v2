import type { DsCrossValidation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBadge } from "./score-badge";
import { StatusBadge } from "./status-badge";
import { getDocTypeLabel } from "@/lib/utils/format";
import { CheckCircle, AlertTriangle, XCircle, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CrossValidationProps {
  crossValidation: DsCrossValidation | null;
}

const statusIcons = {
  ok: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const statusColors = {
  ok: "text-valid",
  warning: "text-warning",
  error: "text-destructive",
};

export function CrossValidation({ crossValidation }: CrossValidationProps) {
  if (!crossValidation) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">
            Cross-validation
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={crossValidation.overall_status} />
          <ScoreBadge score={crossValidation.confidence_score} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Checks */}
        {crossValidation.checks.length > 0 && (
          <div className="space-y-1">
            {crossValidation.checks.map((check, i) => {
              const Icon = statusIcons[check.status];
              return (
                <div
                  key={`${check.name}-${i}`}
                  className="flex items-start gap-2 text-sm"
                >
                  <Icon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      statusColors[check.status],
                    )}
                  />
                  <span>{check.message}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Completeness */}
        {crossValidation.completeness && (
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-xs font-medium">
              Complétude : {crossValidation.completeness.score}%
            </p>
            {crossValidation.completeness.missing_types.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Manquant :{" "}
                {crossValidation.completeness.missing_types.map(getDocTypeLabel).join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Summary */}
        {crossValidation.summary && (
          <p className="text-xs text-muted-foreground">
            {crossValidation.summary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
