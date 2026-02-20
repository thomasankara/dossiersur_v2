import Link from "next/link";
import type { DossierWithCounts } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBadge } from "./score-badge";
import { StatusBadge } from "./status-badge";
import { formatRelativeDate } from "@/lib/utils/format";
import { Users, FileText, ChevronRight } from "lucide-react";

interface DossierCardProps {
  dossier: DossierWithCounts;
}

export function DossierCard({ dossier }: DossierCardProps) {
  return (
    <Link href={`/dashboard/dossier/${dossier.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">
              {dossier.name ?? "Sans nom"}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelativeDate(dossier.updated_at)}
            </p>
          </div>
          <ScoreBadge score={dossier.overall_score} size="md" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusBadge status={dossier.status} />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {dossier.candidats_count}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {dossier.documents_count}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
