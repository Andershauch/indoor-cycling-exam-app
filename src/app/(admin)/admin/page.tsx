import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TextInput } from "@/components/ui/text-input";
import {
  createBatchInvitationsAction,
  createInvitationAction,
  logoutAdminAction,
} from "@/lib/admin/actions";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminDashboardSnapshot } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    batchOk?: string;
    batchError?: string;
    created?: string;
    failed?: string;
    ignored?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [params, dashboard, adminSession] = await Promise.all([
    searchParams,
    getAdminDashboardSnapshot(),
    getAdminSession(),
  ]);

  if (!dashboard) {
    return (
      <div className="slide-grid space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="Upload"
          title="INGEN AKTIV PRØVE"
          description="Gør en prøve aktiv først. Derefter kan du uploade deltagerlisten og sende invitationslinks."
        />
      </div>
    );
  }

  const activeInvitations = dashboard.invitationStats.created + dashboard.invitationStats.sent;
  const recentActivity = dashboard.recentAdminActivity.slice(0, 4);

  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Instruktør-flow"
        title="KLARGØR OG AFVIKL PRØVEN"
        description="Denne side er lavet til hurtig afvikling: upload deltagerlisten, send links, følg status under prøven og hent rapporter bagefter."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button href="/admin/status" variant="secondary" size="lg">
              Åbn status
            </Button>
            <Button href="/invitations" variant="secondary" size="lg">
              Se invitationer
            </Button>
            <Button href="/reports" variant="secondary" size="lg">
              Se rapporter
            </Button>
            {adminSession?.role === "SUPER_ADMIN" ? (
              <>
                <Button href="/questions" variant="secondary" size="lg">
                  Spørgsmål
                </Button>
                <Button href="/admins" variant="secondary" size="lg">
                  Admins
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      {params.batchOk ? (
        <Card tone="strong" title="Excel-import gennemført" eyebrow="Importstatus">
          <p className="text-base leading-7 text-foreground">
            Oprettet: {params.created ?? "0"} · Fejlet: {params.failed ?? "0"} · Ignoreret:{" "}
            {params.ignored ?? "0"}
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            Næste skridt er at åbne status og kontrollere, at invitationerne er sendt, og at de
            første deltagere kan komme ind uden fejl.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button href="/admin/status" size="lg">
              Gå til status
            </Button>
            <Button href="/invitations" variant="secondary" size="lg">
              Se invitationer
            </Button>
          </div>
        </Card>
      ) : null}

      {params.batchError ? (
        <Card title="Excel-import kunne ikke gennemføres" eyebrow="Fejl">
          <p className="text-base leading-7 text-danger">{params.batchError}</p>
          <p className="text-sm leading-7 text-muted-foreground">
            Kontroller filformatet og prøv igen. Hvis kun en enkelt deltager mangler, kan du bruge
            formularen nederst til manuel oprettelse.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Aktiv prøve</p>
          <p className="font-display text-4xl">1</p>
          <p className="text-sm text-muted-foreground">{dashboard.exam.title}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Inviterede</p>
          <p className="font-display text-4xl">{dashboard.invitationStats.total}</p>
          <p className="text-sm text-muted-foreground">
            {activeInvitations} afventer stadig at blive åbnet eller afsluttet
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Beståelseskrav</p>
          <p className="font-display text-4xl">{dashboard.exam.passPercentage}%</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Tidsramme</p>
          <p className="font-display text-4xl">{dashboard.exam.timeLimitMinutes} min</p>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card title="Sådan afvikler du prøven" eyebrow="Kort tjekliste" className="space-y-4">
          <ol className="grid gap-4 text-sm leading-7 text-foreground">
            <li>
              <strong>1. Kontroller den aktive prøve.</strong> Bekræft at titlen og tidsrammen
              ovenfor er korrekte, før du sender noget ud.
            </li>
            <li>
              <strong>2. Upload Excel-filen.</strong> Systemet opretter invitationer og sender
              links automatisk til deltagerne.
            </li>
            <li>
              <strong>3. Åbn status under afviklingen.</strong> Her ser du hurtigt, hvem der har
              åbnet linket, og hvem der er færdige.
            </li>
            <li>
              <strong>4. Brug manuel oprettelse kun som fallback.</strong> Den er bedst til en
              enkelt deltager, der mangler efter import.
            </li>
            <li>
              <strong>5. Hent rapporter bagefter.</strong> Brug rapportsiden til resultater og
              eksport.
            </li>
          </ol>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button href="/admin/status" variant="secondary">
              Status under prøven
            </Button>
            <Button href="/invitations" variant="secondary">
              Invitationsoverblik
            </Button>
            <Button href="/reports" variant="secondary">
              Resultater
            </Button>
          </div>
        </Card>

        <Card title="Hurtigt overblik" eyebrow="Næste handling" className="space-y-4">
          <div className="grid gap-3">
            <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
              <p className="text-sm font-bold uppercase tracking-[0.08em]">Aktiv prøve</p>
              <p className="mt-1 text-base text-foreground">{dashboard.exam.title}</p>
              <p className="text-sm text-muted-foreground">
                {dashboard.exam.questionCount} spørgsmål · {dashboard.exam.timeLimitMinutes} min
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
              <p className="text-sm font-bold uppercase tracking-[0.08em]">Invitationer nu</p>
              <p className="mt-1 text-base text-foreground">
                {dashboard.invitationStats.sent} sendt · {dashboard.invitationStats.opened} åbnet
              </p>
              <p className="text-sm text-muted-foreground">
                {dashboard.invitationStats.completed} færdige · {dashboard.invitationStats.expired} udløbne
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
              <p className="text-sm font-bold uppercase tracking-[0.08em]">Seneste aktivitet</p>
              {recentActivity.length > 0 ? (
                <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
                  {recentActivity.map((entry) => (
                    <li key={entry.id}>
                      {entry.targetLabel ?? entry.action} · {entry.createdAt.toLocaleString("da-DK")}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Ingen admin-aktivitet endnu i denne periode.
                </p>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Upload deltagerliste" eyebrow="Batch fra Excel" className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            Upload Excel-filen med deltagerne. Systemet læser kun kolonnerne
            <strong> Fulde navn</strong> og <strong> E-mailadresse</strong> og ignorerer resten.
          </p>
          <form action={createBatchInvitationsAction} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold uppercase tracking-[0.08em]">Excel-fil</span>
              <input
                type="file"
                name="batchFile"
                accept=".xlsx,.xls"
                className="min-h-12 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 py-3 text-base text-foreground focus-visible:outline-none"
              />
            </label>
            <Button type="submit" size="lg">
              Upload og send links
            </Button>
          </form>
          <p className="text-xs leading-6 text-muted-foreground">
            Brug helst en lille testfil først, hvis du er i tvivl om kolonnenavnene.
          </p>
        </Card>

        <Card title="Tilføj en deltager" eyebrow="Manuel fallback" className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            Brug kun denne, hvis en enkelt deltager mangler efter batch-upload, eller hvis du skal
            løse et enkelt problem hurtigt under afviklingen.
          </p>
          <form action={createInvitationAction} className="grid gap-4">
            <TextInput
              id="recipient-name"
              name="recipientName"
              label="Navn"
              placeholder="Deltagerens navn"
            />
            <TextInput
              id="recipient-email"
              name="recipientEmail"
              label="E-mail"
              type="email"
              placeholder="navn@example.com"
            />
            <input type="hidden" name="channel" value="EMAIL" />
            <Button type="submit" size="lg">
              Send til deltager
            </Button>
          </form>
        </Card>
      </section>

      <div className="flex justify-between gap-3">
        <Button href="/admin/status" variant="secondary" size="lg">
          Åbn status
        </Button>
        <form action={logoutAdminAction}>
          <Button type="submit" variant="secondary" size="sm">
            Log ud
          </Button>
        </form>
      </div>
    </div>
  );
}
