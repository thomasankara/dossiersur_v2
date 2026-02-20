"use client";

import { useCallback, useRef, useState } from "react";
import { useUpload } from "@/hooks/use-upload";
import { AnalysisProgress } from "./analysis-progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOC_TYPE_OPTIONS } from "@/lib/constants/doc-types";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE = 20 * 1024 * 1024;

interface UploadZoneProps {
  candidatId: string;
  dossierId: string;
}

export function UploadZone({ candidatId, dossierId }: UploadZoneProps) {
  const [docType, setDocType] = useState("autre");
  const [dragOver, setDragOver] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { files, isUploading, startUpload, clearCompleted } = useUpload({
    candidatId,
    dossierId,
    docType,
  });

  const validateFiles = useCallback((fileList: File[]): File[] | null => {
    for (const file of fileList) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setClientError(`"${file.name}" : type non supporté. PDF, JPEG, PNG ou WebP.`);
        return null;
      }
      if (file.size > MAX_SIZE) {
        setClientError(`"${file.name}" : fichier trop volumineux (max 20 Mo)`);
        return null;
      }
    }
    setClientError(null);
    return fileList;
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const validated = validateFiles(Array.from(fileList));
      if (validated) {
        startUpload(validated);
      }
    },
    [validateFiles, startUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const doneCount = files.filter((f) => f.state === "done").length;

  return (
    <div className="space-y-3">
      {/* Doc type selector */}
      <Select value={docType} onValueChange={setDocType}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="Type de document" />
        </SelectTrigger>
        <SelectContent>
          {DOC_TYPE_OPTIONS.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Zone de dépôt de fichiers"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          isUploading && "pointer-events-none opacity-50",
        )}
      >
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Glissez vos fichiers ici ou cliquez pour sélectionner
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, JPEG, PNG ou WebP — max 20 Mo
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Client-side error */}
      {clientError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <X className="h-4 w-4 shrink-0" />
          {clientError}
        </div>
      )}

      {/* Progress list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <AnalysisProgress
              key={`${f.file.name}-${i}`}
              filename={f.file.name}
              state={f.state}
              progress={f.progress}
              error={f.error}
            />
          ))}
          {doneCount > 0 && !isUploading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
              className="text-xs text-muted-foreground"
            >
              Effacer les terminés
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
