import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextInput } from "@/components/ui/text-input";
import { loginAdminAction } from "@/lib/admin/actions";
import { getAdminSession, getAdminLoginConfig, isAdminLoginConfigured } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "config") {
    return "Admin-login er ikke konfigureret endnu. Tilføj miljøvariablerne først.";
  }

  if (error === "credentials") {
    return "E-mail eller adgangskode er forkert.";
  }

  return null;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const [session, { error }] = await Promise.all([getAdminSession(), searchParams]);

  if (session) {
    redirect("/admin");
  }

  const config = getAdminLoginConfig();
  const isConfigured = isAdminLoginConfigured();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card tone="strong" className="space-y-6 p-6 sm:p-8">
        <div className="space-y-3">
          <p className="kicker">Admin-login</p>
          <h1 className="section-title">LOG IND</h1>
          <p className="max-w-xl text-base leading-7 text-foreground">
            Log ind for at uploade deltagerlisten og følge prøven undervejs.
          </p>
        </div>

        <form action={loginAdminAction} className="grid gap-4">
          <TextInput
            id="admin-email"
            name="email"
            type="email"
            label="E-mail"
            defaultValue={config.email}
            placeholder="admin@example.com"
            required
          />
          <TextInput
            id="admin-password"
            name="password"
            type="password"
            label="Adgangskode"
            placeholder="Skriv adgangskode"
            required
            error={getErrorMessage(error) ?? undefined}
          />
          <Button type="submit" size="lg" disabled={!isConfigured}>
            Log ind
          </Button>
        </form>

        {!isConfigured ? (
          <p className="text-sm leading-6 text-danger">
            Admin-login er ikke konfigureret endnu. Tilføj miljøvariablerne først.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
