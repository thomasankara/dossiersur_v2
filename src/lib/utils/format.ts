import type { DossierStatus, DocumentStatus, CandidatRole, CrossValidationStatus } from "@/types";

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeDate(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return formatDate(dateString);
}

export function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-valid";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

export function getScoreBgColor(score: number | null): string {
  if (score === null) return "bg-muted";
  if (score >= 80) return "bg-valid/10";
  if (score >= 50) return "bg-warning/10";
  return "bg-destructive/10";
}

const STATUS_LABELS: Record<DossierStatus | DocumentStatus | CrossValidationStatus, string> = {
  en_cours: "En cours",
  complet: "Complet",
  alerte: "Alerte",
  ok: "Validé",
  warning: "Attention",
  error: "Erreur",
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;
}

const ROLE_LABELS: Record<CandidatRole, string> = {
  locataire: "Locataire",
  garant: "Garant",
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as CandidatRole] ?? role;
}

import { DOC_TYPE_LABELS } from "@/lib/constants/doc-types";

export function getDocTypeLabel(docType: string): string {
  return DOC_TYPE_LABELS[docType] ?? docType;
}
