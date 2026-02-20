import { Coins } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";
import type { DsBillingEvent } from "@/types";

interface BillingHistoryProps {
  events: DsBillingEvent[];
}

const typeLabels: Record<string, string> = {
  analysis: "Analyse",
  purchase: "Achat",
  subscription: "Abonnement",
  refund: "Remboursement",
};

export function BillingHistory({ events }: BillingHistoryProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Coins className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Aucune transaction pour le moment
        </p>
        <p className="text-xs text-muted-foreground">
          Vos achats de crédits apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead className="text-right">Crédits</TableHead>
          <TableHead className="text-right">Montant</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id}>
            <TableCell className="text-sm">
              {formatDate(event.created_at)}
            </TableCell>
            <TableCell className="text-sm">
              {typeLabels[event.type] ?? event.type}
            </TableCell>
            <TableCell className="text-sm capitalize">
              {event.plan ?? "-"}
            </TableCell>
            <TableCell
              className={cn(
                "text-right text-sm font-medium",
                event.credits_added > 0
                  ? "text-valid"
                  : event.credits_added < 0
                    ? "text-destructive"
                    : "",
              )}
            >
              {event.credits_added > 0 ? `+${event.credits_added}` : event.credits_added}
            </TableCell>
            <TableCell className="text-right text-sm">
              {event.amount_cents != null
                ? `${(event.amount_cents / 100).toFixed(2)} \u20ac`
                : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
