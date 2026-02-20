"use client";

import type { ValidationCheck } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CheckCircle, AlertTriangle, XCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckListProps {
  checks: ValidationCheck[];
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

export function CheckList({ checks }: CheckListProps) {
  if (checks.length === 0) return null;

  return (
    <div className="space-y-1">
      {checks.map((check, i) => {
        const Icon = statusIcons[check.status];
        return (
          <Collapsible key={`${check.name}-${i}`}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors">
              <Icon className={cn("h-4 w-4 shrink-0", statusColors[check.status])} />
              <span className="flex-1 text-left">{check.message}</span>
              {check.details && (
                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              )}
            </CollapsibleTrigger>
            {check.details && (
              <CollapsibleContent className="px-8 pb-2">
                <p className="text-xs text-muted-foreground">{check.details}</p>
              </CollapsibleContent>
            )}
          </Collapsible>
        );
      })}
    </div>
  );
}
