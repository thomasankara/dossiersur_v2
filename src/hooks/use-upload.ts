"use client";

import { useCallback, useState } from "react";
import { uploadAndAnalyzeDocument } from "@/actions/document";
import type { UploadFileState } from "@/components/dossier/analysis-progress";

interface FileUploadEntry {
  file: File;
  state: UploadFileState;
  progress: number;
  error?: string;
}

interface UseUploadOptions {
  candidatId: string;
  dossierId: string;
  docType: string;
}

export function useUpload({ candidatId, dossierId, docType }: UseUploadOptions) {
  const [files, setFiles] = useState<FileUploadEntry[]>([]);
  const isUploading = files.some(
    (f) => f.state === "uploading" || f.state === "analyzing",
  );

  const startUpload = useCallback(
    async (newFiles: File[]) => {
      const entries: FileUploadEntry[] = newFiles.map((file) => ({
        file,
        state: "pending" as const,
        progress: 0,
      }));

      let startIndex = 0;
      setFiles((prev) => {
        startIndex = prev.length;
        return [...prev, ...entries];
      });

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i]!;
        const idx = startIndex + i;

        setFiles((prev) =>
          prev.map((f, j) =>
            j === idx ? { ...f, state: "uploading", progress: 20 } : f,
          ),
        );

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("candidatId", candidatId);
          formData.append("dossierId", dossierId);
          formData.append("docType", docType);

          setFiles((prev) =>
            prev.map((f, j) =>
              j === idx ? { ...f, state: "analyzing", progress: 60 } : f,
            ),
          );

          const result = await uploadAndAnalyzeDocument(formData);

          if (result.error) {
            setFiles((prev) =>
              prev.map((f, j) =>
                j === idx
                  ? { ...f, state: "error", progress: 100, error: result.error }
                  : f,
              ),
            );
          } else {
            setFiles((prev) =>
              prev.map((f, j) =>
                j === idx ? { ...f, state: "done", progress: 100 } : f,
              ),
            );
          }
        } catch {
          setFiles((prev) =>
            prev.map((f, j) =>
              j === idx
                ? { ...f, state: "error", progress: 100, error: "Erreur inattendue" }
                : f,
            ),
          );
        }
      }
    },
    [candidatId, dossierId, docType],
  );

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.state !== "done"));
  }, []);

  return { files, isUploading, startUpload, clearCompleted };
}
