import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Admin-login"
        title="LOG IND SOM ADMIN"
        description="En enkel loginstruktur til fase 5. Senere kan den erstattes af egentlig auth uden at ændre admin-UI'et."
      />

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card title="Adgang" eyebrow="Sikkerhed">
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
        </Card>

        <Card tone="strong" title="Opsætning" eyebrow="Miljø">
          <div className="space-y-4 text-sm leading-7">
            <p>
              Denne fase bruger en let session-cookie og miljøvariabler til admin-login.
            </p>
            <p>
              Sæt `ADMIN_LOGIN_EMAIL`, `ADMIN_LOGIN_PASSWORD` og
              `ADMIN_SESSION_SECRET` i din lokale `.env`.
            </p>
            <p>
              {isConfigured
                ? "Login er konfigureret og klar til brug."
                : "Login er ikke konfigureret endnu."}
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
