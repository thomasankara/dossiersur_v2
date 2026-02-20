import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layouts/header";

export const metadata = { title: "Tableau de bord" };

export default function DashboardPage() {
  return (
    <>
      <Header>
        <h1 className="text-lg font-semibold">Tableau de bord</h1>
      </Header>
      <div className="flex-1 p-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 font-heading text-xl">Aucun dossier</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Créez votre premier dossier pour commencer à analyser des documents
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/dossier/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau dossier
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
