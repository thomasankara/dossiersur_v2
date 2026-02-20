"use client";

import type { CandidatWithDocuments, DsCrossValidation } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentCard } from "@/components/dossier/document-card";
import { UploadZone } from "@/components/dossier/upload-zone";
import { CrossValidation } from "@/components/dossier/cross-validation";
import { PersonSection } from "@/components/dossier/person-section";
import { getRoleLabel } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { removeCandidat } from "@/actions/dossier";
import { deleteDocument } from "@/actions/document";
import { toast } from "sonner";

interface DossierDetailTabsProps {
  candidats: CandidatWithDocuments[];
  dossierId: string;
  crossValidations: DsCrossValidation[];
}

export function DossierDetailTabs({
  candidats,
  dossierId,
  crossValidations,
}: DossierDetailTabsProps) {
  if (candidats.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ajoutez un candidat pour commencer.
      </p>
    );
  }

  const defaultTab = candidats[0]!.id;

  async function handleRemoveCandidat(formData: FormData) {
    const result = await removeCandidat(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Candidat supprimé");
    }
  }

  async function handleDeleteDocument(formData: FormData) {
    const result = await deleteDocument(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Document supprimé");
    }
  }

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="w-full justify-start">
        {candidats.map((c) => (
          <TabsTrigger key={c.id} value={c.id} className="min-w-0">
            <span className="truncate">
              {c.prenom || c.nom
                ? `${c.prenom ?? ""} ${c.nom ?? ""}`.trim()
                : getRoleLabel(c.role)}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {candidats.map((candidat) => {
        const cv = crossValidations.find((x) => x.candidat_id === candidat.id) ?? null;
        const personFromDocs = candidat.documents.find((d) => d.person)?.person ?? null;

        return (
          <TabsContent key={candidat.id} value={candidat.id} className="space-y-6">
            {/* Candidat info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">
                  {getRoleLabel(candidat.role)}
                  {(candidat.nom || candidat.prenom) && (
                    <span className="ml-2 text-muted-foreground">
                      — {candidat.prenom} {candidat.nom}
                    </span>
                  )}
                </h3>
              </div>
              {candidats.length > 1 && (
                <form action={handleRemoveCandidat}>
                  <input type="hidden" name="candidatId" value={candidat.id} />
                  <input type="hidden" name="dossierId" value={dossierId} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Retirer
                  </Button>
                </form>
              )}
            </div>

            {/* Person extraction */}
            <PersonSection person={personFromDocs} />

            {/* Upload zone */}
            <UploadZone candidatId={candidat.id} dossierId={dossierId} />

            {/* Documents */}
            {candidat.documents.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  Documents ({candidat.documents.length})
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {candidat.documents.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      dossierId={dossierId}
                      onDelete={handleDeleteDocument}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cross-validation */}
            <CrossValidation crossValidation={cv} />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
