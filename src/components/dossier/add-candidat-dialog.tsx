"use client";

import { useState } from "react";
import { addCandidat } from "@/actions/dossier";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddCandidatDialogProps {
  dossierId: string;
}

export function AddCandidatDialog({ dossierId }: AddCandidatDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const result = await addCandidat(formData);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Candidat ajouté");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter un candidat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={handleSubmit}>
          <input type="hidden" name="dossierId" value={dossierId} />
          <DialogHeader>
            <DialogTitle>Ajouter un candidat</DialogTitle>
            <DialogDescription>
              Ajoutez un locataire ou un garant au dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <RadioGroup name="role" defaultValue="locataire" className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="locataire" id="role-locataire" />
                  <Label htmlFor="role-locataire" className="font-normal">
                    Locataire
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="garant" id="role-garant" />
                  <Label htmlFor="role-garant" className="font-normal">
                    Garant
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom (optionnel)</Label>
                <Input id="prenom" name="prenom" placeholder="Jean" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom (optionnel)</Label>
                <Input id="nom" name="nom" placeholder="Dupont" />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
