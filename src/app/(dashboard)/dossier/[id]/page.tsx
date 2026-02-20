import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layouts/header";
import { ScoreBadge } from "@/components/dossier/score-badge";
import { StatusBadge } from "@/components/dossier/status-badge";
import { AddCandidatDialog } from "@/components/dossier/add-candidat-dialog";
import { DeleteDossierButton } from "@/components/dossier/delete-dossier-button";
import { DossierDetailTabs } from "./dossier-detail-tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";
import type {
  DsDossier,
  DsCandidat,
  DsDocument,
  DsCrossValidation,
  CandidatWithDocuments,
} from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("ds_dossiers")
    .select("name")
    .eq("id", id)
    .single();

  return { title: (data?.name as string | null) ?? "Dossier" };
}

export default async function DossierDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch dossier
  const { data: dossier } = await supabase
    .from("ds_dossiers")
    .select("*")
    .eq("id", id)
    .single();

  if (!dossier) notFound();

  // Cast via field extraction (avoids `as unknown as`)
  const typedDossier: DsDossier = {
    id: dossier.id as string,
    user_id: dossier.user_id as string,
    name: dossier.name as string | null,
    status: dossier.status as DsDossier["status"],
    overall_score: dossier.overall_score as number | null,
    created_at: dossier.created_at as string,
    updated_at: dossier.updated_at as string,
  };

  // Fetch candidats, documents, cross-validations, profile in parallel
  const [candidatsRes, documentsRes, crossValidationsRes, profileRes] =
    await Promise.all([
      supabase
        .from("ds_candidats")
        .select("*")
        .eq("dossier_id", id)
        .order("created_at"),
      supabase
        .from("ds_documents")
        .select("*")
        .eq("dossier_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("ds_cross_validations")
        .select("*")
        .eq("dossier_id", id),
      supabase
        .from("ds_profiles")
        .select("credits_remaining")
        .eq("id", user.id)
        .single(),
    ]);

  const candidats = (candidatsRes.data ?? []) as unknown as DsCandidat[];
  const documents = (documentsRes.data ?? []) as unknown as DsDocument[];
  const crossValidations = (crossValidationsRes.data ?? []) as unknown as DsCrossValidation[];
  const creditsRemaining = (profileRes.data?.credits_remaining as number | null) ?? 0;

  // Build candidats with documents
  const candidatsWithDocs: CandidatWithDocuments[] = candidats.map((c) => ({
    ...c,
    documents: documents.filter((d) => d.candidat_id === c.id),
    cross_validation: crossValidations.find((cv) => cv.candidat_id === c.id) ?? null,
  }));

  return (
    <>
      <Header>
        <div className="flex flex-1 items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8" aria-label="Retour au tableau de bord">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">
              {typedDossier.name ?? "Sans nom"}
            </h1>
          </div>
          <StatusBadge status={typedDossier.status} />
          <ScoreBadge score={typedDossier.overall_score} size="md" />
        </div>
      </Header>
      <div className="flex-1 space-y-6 p-6">
        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          <AddCandidatDialog dossierId={id} />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            {creditsRemaining} crédit{creditsRemaining > 1 ? "s" : ""} restant{creditsRemaining > 1 ? "s" : ""}
          </div>
          <div className="flex-1" />
          <DeleteDossierButton dossierId={id} />
        </div>

        {/* Tabs per candidat */}
        <DossierDetailTabs
          candidats={candidatsWithDocs}
          dossierId={id}
          crossValidations={crossValidations}
        />
      </div>
    </>
  );
}
