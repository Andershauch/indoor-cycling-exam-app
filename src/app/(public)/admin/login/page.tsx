import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextInput } from "@/components/ui/text-input";
import { loginAdminAction } from "@/lib/admin/actions";
import { getAdminSession, isAdminLoginConfigured } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    sent?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "config":
      return "Admin-login er ikke konfigureret endnu. Tilfoej superadmin og de noedvendige secrets foerst.";
    case "email":
      return "Skriv en gyldig admin-e-mail for at faa et magic link.";
    case "expired":
      return "Magic linket er udloebet eller allerede brugt. Bestil et nyt link.";
    case "rate-limit":
      return "For mange loginforsoeg lige nu. Vent lidt og proev igen.";
    case "send-failed":
      return "Magic linket kunne ikke sendes. Kontroller mailopsaetningen og proev igen.";
    default:
      return null;
  }
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const [session, params] = await Promise.all([getAdminSession(), searchParams]);

  if (session) {
    redirect("/admin");
  }

  const isConfigured = isAdminLoginConfigured();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card tone="strong" className="space-y-6 p-6 sm:p-8">
        <div className="space-y-3">
          <p className="kicker">Admin-login</p>
          <h1 className="section-title">FAA ET MAGIC LINK</h1>
          <p className="max-w-xl text-base leading-7 text-foreground">
            Skriv din admin-e-mail. Hvis adressen er godkendt, sender systemet et engangslink,
            som logger dig direkte ind.
          </p>
        </div>

        <form action={loginAdminAction} className="grid gap-4">
          <TextInput
            id="admin-email"
            name="email"
            type="email"
            label="Admin-e-mail"
            placeholder="admin@example.com"
            required
            error={getErrorMessage(params.error) ?? undefined}
          />
          <Button type="submit" size="lg" disabled={!isConfigured}>
            Send magic link
          </Button>
        </form>

        {params.sent ? (
          <p className="text-sm leading-6 text-foreground">
            Hvis e-mailadressen er godkendt, er linket sendt. Tjek din indbakke og spam-mappe.
          </p>
        ) : null}

        {!isConfigured ? (
          <p className="text-sm leading-6 text-danger">
            Admin-login er ikke konfigureret endnu. Tilfoej superadmin, mailopsaetning og
            sessions-secrets foerst.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
