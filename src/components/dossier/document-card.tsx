import type { DsDocument } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "./score-badge";
import { StatusBadge } from "./status-badge";
import { getDocTypeLabel } from "@/lib/utils/format";
import { FileText, Trash2 } from "lucide-react";
interface DocumentCardProps {
  document: DsDocument;
  dossierId: string;
  onDelete?: (formData: FormData) => void;
}

export function DocumentCard({ document, dossierId, onDelete }: DocumentCardProps) {
  const checksCount = document.validation_result?.checks.length ?? 0;
  const errorsCount =
    document.validation_result?.checks.filter((c) => c.status === "error")
      .length ?? 0;
  const warningsCount =
    document.validation_result?.checks.filter((c) => c.status === "warning")
      .length ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium leading-tight">
              {document.filename}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {getDocTypeLabel(document.classified_type ?? document.doc_type)}
            </p>
          </div>
        </div>
        <ScoreBadge score={document.confidence_score} size="sm" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {document.overall_status && (
            <StatusBadge status={document.overall_status} />
          )}
          <span className="text-xs text-muted-foreground">
            {checksCount} vérification{checksCount > 1 ? "s" : ""}
            {errorsCount > 0 && ` · ${errorsCount} erreur${errorsCount > 1 ? "s" : ""}`}
            {warningsCount > 0 && ` · ${warningsCount} alerte${warningsCount > 1 ? "s" : ""}`}
          </span>
        </div>
        {onDelete && (
          <form action={onDelete}>
            <input type="hidden" name="documentId" value={document.id} />
            <input type="hidden" name="dossierId" value={dossierId} />
            <input type="hidden" name="candidatId" value={document.candidat_id} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Supprimer
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
