import { AdminRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  getAdminDashboardSnapshot,
  getExamSessionAdminSnapshot,
} from "@/lib/admin/data";
import { getAdminInvitationsSnapshot } from "@/lib/invitations/service";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) {
    return "Ikke sat";
  }

  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatSessionStatus(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Aktiv";
    case "CLOSED":
      return "Afsluttet";
    default:
      return "Kladde";
  }
}

export default async function SuperAdminPage() {
  await requireAdminSession(AdminRole.SUPER_ADMIN);

  const [sessionSnapshot, dashboard, invitationSnapshot] = await Promise.all([
    getExamSessionAdminSnapshot({ includeAll: true }),
    getAdminDashboardSnapshot(),
    getAdminInvitationsSnapshot(),
  ]);

  if (!dashboard) {
    return (
      <div className="space-y-6 py-6 sm:py-8 lg:py-8">
        <Card tone="strong" className="space-y-4 p-6 sm:p-7">
          <p className="kicker">Superadmin</p>
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] leading-[0.98] uppercase tracking-[-0.03em]">
            Ingen prøveformater endnu
          </h1>
          <p className="content-copy text-base">
            Opret eller importér først et prøveformat. Derefter kan instruktører oprette
            prøveafholdelser ud fra formatet.
          </p>
        </Card>
      </div>
    );
  }

  const recentActivity = dashboard.recentAdminActivity.slice(0, 3);
  const testParticipants = invitationSnapshot?.invitations.slice(0, 3) ?? [];
  const recentSessions = sessionSnapshot.sessions.slice(0, 4);
  const activeSessionCount = sessionSnapshot.sessions.filter(
    (examSession) => examSession.status === "ACTIVE",
  ).length;
  const closedSessionCount = sessionSnapshot.sessions.filter(
    (examSession) => examSession.status === "CLOSED",
  ).length;
  const totalSessionParticipants = sessionSnapshot.sessions.reduce(
    (sum, examSession) => sum + examSession.invitationCount,
    0,
  );
  const totalSessionCompleted = sessionSnapshot.sessions.reduce(
    (sum, examSession) => sum + examSession.completedAttemptCount,
    0,
  );

  return (
    <div className="space-y-6 py-6 sm:py-8 lg:space-y-7 lg:py-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card tone="strong" className="space-y-5 p-6 sm:p-7">
          <div className="space-y-3">
            <p className="kicker">Superadmin</p>
            <h1 className="font-display text-[clamp(2.1rem,4.2vw,3.25rem)] leading-[0.98] uppercase tracking-[-0.035em]">
              Systemoverblik
            </h1>
            <p className="content-copy text-base">
              Følg prøveafholdelser, rapporter og systemopsætning på tværs. Deltagerlister og
              Excel-upload ligger hos instruktørens konkrete afholdelse.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-[1rem] border border-border/10 bg-white/55 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Aktive
              </p>
              <p className="mt-2 font-display text-3xl leading-none">{activeSessionCount}</p>
            </div>
            <div className="rounded-[1rem] border border-border/10 bg-white/55 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Afsluttede
              </p>
              <p className="mt-2 font-display text-3xl leading-none">{closedSessionCount}</p>
            </div>
            <div className="rounded-[1rem] border border-border/10 bg-white/55 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Deltagere
              </p>
              <p className="mt-2 font-display text-3xl leading-none">{totalSessionParticipants}</p>
            </div>
            <div className="rounded-[1rem] border border-border/10 bg-white/55 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Afleveret
              </p>
              <p className="mt-2 font-display text-3xl leading-none">{totalSessionCompleted}</p>
            </div>
          </div>
        </Card>

        <Card
          title="Hurtige handlinger"
          eyebrow="Navigation"
          titleClassName="text-[clamp(1.55rem,2.8vw,2.15rem)] leading-[1.02] tracking-[-0.02em]"
          className="space-y-4"
        >
          <div className="grid gap-2">
            <Button href="/admin/status" size="lg" className="w-full">
              Prøveafholdelser
            </Button>
            <Button href="/reports" variant="secondary" size="lg" className="w-full">
              Rapporter
            </Button>
            <Button href="/questions" variant="secondary" size="lg" className="w-full">
              Prøveformater
            </Button>
            <Button href="/admins" variant="secondary" size="lg" className="w-full">
              Instruktører
            </Button>
          </div>
        </Card>
      </section>

      <Card
        title="Seneste prøveafholdelser"
        eyebrow="På tværs af instruktører"
        titleClassName="text-[clamp(1.7rem,2.8vw,2.25rem)] leading-[1] tracking-[-0.02em]"
        className="space-y-4"
      >
        {recentSessions.length > 0 ? (
          <div className="grid gap-3">
            {recentSessions.map((examSession) => (
              <div
                key={examSession.id}
                className="flex flex-col gap-3 rounded-[1rem] border border-border-soft bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-bold">{examSession.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {examSession.examSetTitle} · {formatSessionStatus(examSession.status)} ·{" "}
                    {formatDate(examSession.startsAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {examSession.createdByAdmin?.name ?? "Ukendt instruktør"} ·{" "}
                    {examSession.invitationCount} deltagere · {examSession.completedAttemptCount}{" "}
                    afleveret
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    href={`/admin/sessions/${examSession.id}?view=instructor`}
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                  >
                    Åbn
                  </Button>
                  <Button
                    href={`/reports?examSessionId=${examSession.id}`}
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                  >
                    Rapport
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            Der er endnu ingen konkrete prøveafholdelser. Når instruktører opretter hold, vises de
            her.
          </p>
        )}
        <div className="border-t border-border-soft pt-4">
          <Button href="/admin/status" variant="secondary" size="lg" className="w-full">
            Se alle afholdelser
          </Button>
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card
          title="Seneste aktivitet"
          eyebrow="Audit"
          titleClassName="text-[clamp(1.55rem,2.8vw,2.1rem)] leading-[1.02] tracking-[-0.02em]"
          className="space-y-3"
        >
          {recentActivity.length > 0 ? (
            <ul className="grid gap-3 text-sm text-muted-foreground">
              {recentActivity.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-[1rem] border border-border-soft bg-surface p-3"
                >
                  <p className="font-bold text-foreground">{entry.targetLabel ?? entry.action}</p>
                  <p>{entry.createdAt.toLocaleString("da-DK")}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">Ingen aktivitet endnu.</p>
          )}
        </Card>

        <Card
          title="Support og test"
          eyebrow="Preview"
          titleClassName="text-[clamp(1.55rem,2.8vw,2.1rem)] leading-[1.02] tracking-[-0.02em]"
          className="space-y-4"
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Brug preview, når du skal hjælpe en instruktør eller teste deltagerflow uden nye mails.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button href="/admin?view=instructor" variant="secondary" size="lg" className="w-full">
              Instruktør-preview
            </Button>
            {testParticipants[0] ? (
              <Button
                href={testParticipants[0].invitationLink}
                target="_blank"
                rel="noreferrer"
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Deltager-preview
              </Button>
            ) : (
              <Button href="/admin/status" variant="secondary" size="lg" className="w-full">
                Find deltager
              </Button>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
