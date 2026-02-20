"use client";

import type { DsDocument } from "@/types";
import { DocumentCard } from "@/components/dossier/document-card";
import { CheckList } from "@/components/dossier/check-list";
import { ForensicSection } from "@/components/dossier/forensic-section";
import { deleteDocument } from "@/actions/document";
import { toast } from "sonner";

interface CandidatDocumentsProps {
  documents: DsDocument[];
  dossierId: string;
}

export function CandidatDocuments({ documents, dossierId }: CandidatDocumentsProps) {
  async function handleDeleteDocument(formData: FormData) {
    const result = await deleteDocument(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Document supprimé");
    }
  }

  if (documents.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">
        Documents ({documents.length})
      </h3>
      {documents.map((doc) => (
        <div key={doc.id} className="space-y-3">
          <DocumentCard
            document={doc}
            dossierId={dossierId}
            onDelete={handleDeleteDocument}
          />
          {doc.validation_result && (
            <div className="ml-4 space-y-3 border-l-2 border-muted pl-4">
              <CheckList checks={doc.validation_result.checks} />
              <ForensicSection forensic={doc.validation_result.forensic} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
