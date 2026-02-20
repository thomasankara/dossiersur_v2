"use client";

import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadFileState = "pending" | "uploading" | "analyzing" | "done" | "error";

interface AnalysisProgressProps {
  filename: string;
  state: UploadFileState;
  progress: number;
  error?: string;
}

const stateLabels: Record<UploadFileState, string> = {
  pending: "En attente",
  uploading: "Upload en cours…",
  analyzing: "Analyse en cours…",
  done: "Terminé",
  error: "Erreur",
};

export function AnalysisProgress({
  filename,
  state,
  progress,
  error,
}: AnalysisProgressProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <div className="shrink-0">
        {state === "done" ? (
          <CheckCircle className="h-4 w-4 text-valid" />
        ) : state === "error" ? (
          <XCircle className="h-4 w-4 text-destructive" />
        ) : state === "uploading" || state === "analyzing" ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm">{filename}</p>
        <div className="flex items-center gap-2">
          <Progress
            value={progress}
            className={cn("h-1.5 flex-1", state === "error" && "[&>div]:bg-destructive")}
          />
          <span
            className={cn(
              "text-xs whitespace-nowrap",
              state === "error" ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {error ?? stateLabels[state]}
          </span>
        </div>
      </div>
    </div>
  );
}
