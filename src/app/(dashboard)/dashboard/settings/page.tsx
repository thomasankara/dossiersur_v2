import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layouts/header";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { DeleteAccountButton } from "./delete-account-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Mail, User, Lock, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("ds_profiles")
    .select("full_name, email, plan, credits_remaining, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const fullName = profile.full_name ?? "";
  const email = profile.email ?? user.email ?? "";
  const plan = profile.plan ?? "free";
  const credits = profile.credits_remaining ?? 0;
  const createdAt = profile.created_at ?? "";

  return (
    <>
      <Header>
        <h1 className="text-lg font-semibold">Paramètres</h1>
      </Header>
      <div className="flex-1 space-y-6 p-6">
        {/* Profile */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Profil</CardTitle>
              <CardDescription>
                Modifiez vos informations personnelles
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ProfileForm defaultName={fullName} />
          </CardContent>
        </Card>

        {/* Email (read-only) */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Email</CardTitle>
              <CardDescription>
                Votre adresse email de connexion
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{email}</p>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">
                Mot de passe
              </CardTitle>
              <CardDescription>
                Changez votre mot de passe
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        {/* Plan & credits */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">
                Abonnement
              </CardTitle>
              <CardDescription>
                Votre plan et vos crédits
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="capitalize">
                {plan}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {credits} crédit{credits !== 1 ? "s" : ""} restant{credits !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Membre depuis le {formatDate(createdAt)}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/billing">Gérer la facturation</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <div>
              <CardTitle className="text-sm font-medium text-destructive">
                Zone dangereuse
              </CardTitle>
              <CardDescription>
                Actions irréversibles sur votre compte
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DeleteAccountButton />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
