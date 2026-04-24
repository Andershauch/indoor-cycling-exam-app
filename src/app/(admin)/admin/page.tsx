import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextInput } from "@/components/ui/text-input";
import {
  createBatchInvitationsAction,
  createInvitationAction,
} from "@/lib/admin/actions";
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
  const [params, dashboard] = await Promise.all([searchParams, getAdminDashboardSnapshot()]);

  if (!dashboard) {
    return (
      <div className="space-y-6 py-6 sm:py-8 lg:py-8">
        <Card tone="strong" className="space-y-4 p-6 sm:p-7">
          <p className="kicker">Før prøven</p>
          <h1 className="font-display text-[clamp(2.35rem,4.4vw,3.4rem)] leading-[0.96] uppercase tracking-[-0.04em]">
            Ingen aktiv prøve
          </h1>
          <p className="content-copy text-base">
            Gør en prøve aktiv først. Derefter kan du uploade deltagerlisten og sende
            invitationslinks.
          </p>
        </Card>
      </div>
    );
  }

  const recentActivity = dashboard.recentAdminActivity.slice(0, 3);

  return (
    <div className="space-y-6 py-6 sm:py-8 lg:space-y-7 lg:py-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card tone="strong" className="space-y-5 p-6 sm:p-7">
          <div className="space-y-3">
            <p className="kicker">Før prøven</p>
            <h1 className="font-display text-[clamp(2.6rem,4.8vw,3.8rem)] leading-[0.95] uppercase tracking-[-0.045em]">
              Klargør prøven
            </h1>
            <p className="content-copy text-base">
              Brug denne side til det praktiske før start: tjek den aktive prøve, upload
              deltagerlisten og gå derefter videre til <strong>Status</strong>, når links er sendt.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1rem] border border-border/10 bg-white/55 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Aktiv prøve
              </p>
              <p className="mt-2 text-base font-bold text-foreground">{dashboard.exam.title}</p>
            </div>
            <div className="rounded-[1rem] border border-border/10 bg-white/55 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Format
              </p>
              <p className="mt-2 text-base font-bold text-foreground">
                {dashboard.exam.questionCount} spørgsmål
              </p>
            </div>
            <div className="rounded-[1rem] border border-border/10 bg-white/55 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Tidsramme
              </p>
              <p className="mt-2 text-base font-bold text-foreground">
                {dashboard.exam.timeLimitMinutes} min
              </p>
            </div>
          </div>
        </Card>

        <Card
          title="Det vigtigste nu"
          eyebrow="Overblik"
          titleClassName="text-[clamp(1.55rem,2.8vw,2.15rem)] leading-[1.02] tracking-[-0.02em]"
          className="space-y-4"
        >
          <div className="grid gap-3">
            <div className="rounded-[1rem] border border-border-soft bg-surface px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Invitationer nu
              </p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {dashboard.invitationStats.sent} sendt · {dashboard.invitationStats.opened} åbnet
              </p>
              <p className="text-sm text-muted-foreground">
                {dashboard.invitationStats.completed} færdige · {dashboard.invitationStats.expired}{" "}
                udløbne
              </p>
            </div>
            <div className="rounded-[1rem] border border-border-soft bg-surface px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Næste skridt
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground">
                Når deltagerne har modtaget links, går du til <strong>Status</strong> for at følge
                åbnet, aktive og afleverede forsøg.
              </p>
            </div>
            {recentActivity.length > 0 ? (
              <div className="rounded-[1rem] border border-border-soft bg-surface px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Seneste aktivitet
                </p>
                <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
                  {recentActivity.map((entry) => (
                    <li key={entry.id}>
                      {entry.targetLabel ?? entry.action} · {entry.createdAt.toLocaleString("da-DK")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Card>
      </section>

      {params.batchOk ? (
        <Card tone="strong" title="Excel-import gennemført" eyebrow="Importstatus">
          <p className="text-base leading-7 text-foreground">
            Oprettet: {params.created ?? "0"} · Fejlet: {params.failed ?? "0"} · Ignoreret:{" "}
            {params.ignored ?? "0"}
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            Åbn menupunktet <strong>Status</strong> for at følge, om deltagerne kommer ind og
            gennemfører prøven som forventet.
          </p>
        </Card>
      ) : null}

      {params.batchError ? (
        <Card
          title="Excel-import kunne ikke gennemføres"
          eyebrow="Fejl"
          titleClassName="text-[clamp(1.35rem,2.2vw,1.75rem)] leading-[1.04] tracking-[-0.015em]"
        >
          <p className="text-base leading-7 text-danger">{params.batchError}</p>
          <p className="text-sm leading-7 text-muted-foreground">
            Kontroller filformatet og prøv igen. Hvis kun en enkelt deltager mangler, kan du bruge
            formularen nedenfor til manuel oprettelse.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          title="Upload deltagerliste"
          eyebrow="Batch fra Excel"
          titleClassName="text-[clamp(1.7rem,2.8vw,2.25rem)] leading-[1] tracking-[-0.02em]"
          className="space-y-4"
        >
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

        <div className="grid gap-5">
          <Card
            title="Tilføj en deltager"
            eyebrow="Manuel fallback"
            titleClassName="text-[clamp(1.6rem,2.6vw,2.1rem)] leading-[1] tracking-[-0.02em]"
            className="space-y-4"
          >
            <p className="text-sm leading-7 text-muted-foreground">
              Brug kun denne, hvis en enkelt deltager mangler efter batch-upload.
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

          <Card
            title="Husk under afviklingen"
            eyebrow="Når prøven er i gang"
            titleClassName="text-[clamp(1.45rem,2.4vw,1.9rem)] leading-[1.03] tracking-[-0.015em]"
            className="space-y-4"
          >
            <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
              <li>
                <strong className="text-foreground">Gå til Status.</strong> Her ser du, hvem der
                har åbnet linket, hvem der er i gang, og hvem der er færdige.
              </li>
              <li>
                <strong className="text-foreground">Brug Rapporter bagefter.</strong> Her finder du
                resultater og eksport.
              </li>
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}
