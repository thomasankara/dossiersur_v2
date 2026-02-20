"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const result = await resetPassword(formData);
    if (result?.error) {
      setError(result.error);
    }
    if (result?.success) {
      setSuccess(result.success);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl">
          Mot de passe oublié
        </CardTitle>
        <CardDescription>
          Entrez votre email pour recevoir un lien de réinitialisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="vous@exemple.com"
              required
              autoComplete="email"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {success && (
            <p className="text-sm text-valid">{success}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer le lien"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Retour à la connexion
        </Link>
      </CardFooter>
    </Card>
  );
}
