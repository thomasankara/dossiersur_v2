import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layouts/header";
import { DossierList } from "@/components/dossier/dossier-list";
import { createClient } from "@/lib/supabase/server";
import type { DossierWithCounts, DossierStatus } from "@/types";

export const metadata = { title: "Tableau de bord" };

interface CountResult {
  count: number;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch dossiers with candidats/documents counts
  const { data: rawDossiers } = await supabase
    .from("ds_dossiers")
    .select(`
      *,
      ds_candidats(count),
      ds_documents(count)
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const dossiers: DossierWithCounts[] = (rawDossiers ?? []).map((d) => {
    const candidatsCounts = d.ds_candidats as unknown as CountResult[];
    const documentsCounts = d.ds_documents as unknown as CountResult[];

    return {
      id: d.id as string,
      user_id: d.user_id as string,
      name: d.name as string | null,
      status: d.status as DossierStatus,
      overall_score: d.overall_score as number | null,
      created_at: d.created_at as string,
      updated_at: d.updated_at as string,
      candidats_count: candidatsCounts[0]?.count ?? 0,
      documents_count: documentsCounts[0]?.count ?? 0,
    };
  });

  const isEmpty = dossiers.length === 0;

  return (
    <>
      <Header>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-lg font-semibold">Tableau de bord</h1>
          {!isEmpty && (
            <Button asChild size="sm">
              <Link href="/dashboard/dossier/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau dossier
              </Link>
            </Button>
          )}
        </div>
      </Header>
      <div className="flex-1 p-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
            <h2 className="mt-4 font-heading text-xl">Aucun dossier</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Créez votre premier dossier pour commencer à analyser des
              documents
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/dossier/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau dossier
              </Link>
            </Button>
          </div>
        ) : (
          <DossierList dossiers={dossiers} />
        )}
      </div>
    </>
  );
}
