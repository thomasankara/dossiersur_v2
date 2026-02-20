import type { PersonExtraction } from "@/types";
import { User, Calendar } from "lucide-react";

interface PersonSectionProps {
  person: PersonExtraction | null;
}

export function PersonSection({ person }: PersonSectionProps) {
  if (!person || (!person.nom && !person.prenom && !person.date_naissance)) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="mb-3 text-sm font-medium text-muted-foreground">
        Informations extraites
      </h4>
      <div className="space-y-2">
        {(person.nom || person.prenom) && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>
              {person.prenom} {person.nom}
            </span>
            {person.confidence !== null && (
              <span className="text-xs text-muted-foreground">
                ({Math.round(person.confidence * 100)}%)
              </span>
            )}
          </div>
        )}
        {person.date_naissance && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{person.date_naissance}</span>
          </div>
        )}
        {person.source && (
          <p className="text-xs text-muted-foreground">
            Source : {person.source}
          </p>
        )}
      </div>
    </div>
  );
}
