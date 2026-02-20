"use client";

import type { ForensicResult } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FileSearch, ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForensicSectionProps {
  forensic: ForensicResult | null;
}

export function ForensicSection({ forensic }: ForensicSectionProps) {
  if (!forensic) return null;

  const hasSuspicious =
    forensic.suspicious_tools.length > 0 ||
    (forensic.font_analysis?.is_suspicious ?? false);

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm hover:bg-muted/50 transition-colors">
        <FileSearch className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left font-medium">
          Analyse forensique
        </span>
        {hasSuspicious && (
          <AlertTriangle className="h-4 w-4 text-warning" />
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 rounded-lg border bg-card p-4 space-y-3">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {forensic.producer && (
              <div>
                <span className="text-muted-foreground">Producteur : </span>
                {forensic.producer}
              </div>
            )}
            {forensic.creator && (
              <div>
                <span className="text-muted-foreground">Créateur : </span>
                {forensic.creator}
              </div>
            )}
            {forensic.creation_date && (
              <div>
                <span className="text-muted-foreground">Créé le : </span>
                {forensic.creation_date}
              </div>
            )}
            {forensic.modification_date && (
              <div>
                <span className="text-muted-foreground">Modifié le : </span>
                {forensic.modification_date}
              </div>
            )}
          </div>

          {/* Suspicious tools */}
          {forensic.suspicious_tools.length > 0 && (
            <div className="rounded-md bg-destructive/10 px-3 py-2">
              <p className="text-xs font-medium text-destructive">
                Outils suspects détectés :
              </p>
              <ul className="mt-1 list-inside list-disc text-xs text-destructive">
                {forensic.suspicious_tools.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tool detected */}
          {forensic.tool_detected && !hasSuspicious && (
            <p className="text-xs text-muted-foreground">
              Outil détecté : {forensic.tool_detected}
            </p>
          )}

          {/* Font analysis */}
          {forensic.font_analysis && (
            <div className={cn(
              "rounded-md px-3 py-2 text-xs",
              forensic.font_analysis.is_suspicious
                ? "bg-warning/10 text-warning"
                : "bg-muted text-muted-foreground",
            )}>
              <p className="font-medium">
                {forensic.font_analysis.is_suspicious
                  ? "Polices suspectes détectées"
                  : "Polices normales"}
              </p>
              {forensic.font_analysis.fonts_found.length > 0 && (
                <p className="mt-1">
                  Polices : {forensic.font_analysis.fonts_found.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
