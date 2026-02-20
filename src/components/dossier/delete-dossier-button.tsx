"use client";

import { deleteDossier } from "@/actions/dossier";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteDossierButtonProps {
  dossierId: string;
}

export function DeleteDossierButton({ dossierId }: DeleteDossierButtonProps) {
  async function handleDelete(formData: FormData) {
    const result = await deleteDossier(formData);
    if (result?.error) {
      toast.error(result.error);
    }
    // On success, redirect happens server-side
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="mr-1 h-3 w-3" />
          Supprimer le dossier
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce dossier ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Tous les candidats, documents et
            résultats d&apos;analyse seront supprimés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <form action={handleDelete}>
            <input type="hidden" name="dossierId" value={dossierId} />
            <AlertDialogAction
              type="submit"
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
