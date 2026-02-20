"use client";

import { createDossier } from "@/actions/dossier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function NewDossierForm() {
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const result = await createDossier(formData);
    setPending(false);

    if (result?.error) {
      toast.error(result.error);
    }
    // If success, redirect happens server-side
  }

  return (
    <form action={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations du dossier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du dossier</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex : Appartement rue de la Paix"
              required
              autoFocus
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Premier candidat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Rôle</Label>
            <RadioGroup name="candidatRole" defaultValue="locataire" className="flex gap-4">
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
              <Label htmlFor="candidatPrenom">Prénom (optionnel)</Label>
              <Input id="candidatPrenom" name="candidatPrenom" placeholder="Jean" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidatNom">Nom (optionnel)</Label>
              <Input id="candidatNom" name="candidatNom" placeholder="Dupont" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Créer le dossier
      </Button>
    </form>
  );
}
