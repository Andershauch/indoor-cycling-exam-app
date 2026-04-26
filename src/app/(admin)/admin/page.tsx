import { AdminRole } from "@prisma/client";
import { InstructorExamFlow } from "@/components/admin/instructor-exam-flow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextInput } from "@/components/ui/text-input";
import { createExamSessionAction } from "@/lib/admin/actions";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  getAdminDashboardSnapshot,
  getAdminReportsSnapshot,
  getExamSessionAdminSnapshot,
} from "@/lib/admin/data";
import { getAdminInvitationsSnapshot } from "@/lib/invitations/service";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    batchOk?: string;
    batchError?: string;
    created?: string;
    failed?: string;
    ignored?: string;
    closed?: string;
    closeError?: string;
    createOk?: string;
    createError?: string;
    recipient?: string;
    view?: string;
    session?: string;
  }>;
};

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

type ExamSessionSnapshot = Awaited<ReturnType<typeof getExamSessionAdminSnapshot>>;
type ExamSessionListItem = ExamSessionSnapshot["sessions"][number];

function getSessionHref(examSessionId: string, isSuperAdminPreview: boolean) {
  return isSuperAdminPreview
    ? `/admin?view=instructor&session=${examSessionId}`
    : `/admin?session=${examSessionId}`;
}

function ExamSessionCreateCard({
  examSets,
  isSuperAdminPreview,
}: {
  examSets: ExamSessionSnapshot["examSets"];
  isSuperAdminPreview: boolean;
}) {
  const hasExamFormats = examSets.length > 0;

  return (
    <Card
      title="Ny prøveafholdelse"
      eyebrow="Start her"
      titleClassName="text-[clamp(1.55rem,6vw,2.2rem)] leading-[1] tracking-[-0.02em]"
      className="space-y-4"
    >
      <form action={createExamSessionAction} className="grid gap-4">
        {isSuperAdminPreview ? <input type="hidden" name="view" value="instructor" /> : null}
        <label className="grid gap-2">
          <span className="text-sm font-bold uppercase tracking-[0.08em]">Prøveformat</span>
          <select
            name="examSetId"
            className="min-h-12 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 text-base text-foreground focus-visible:outline-none"
            required
            disabled={!hasExamFormats}
          >
            {examSets.map((examSet) => (
              <option key={examSet.id} value={examSet.id}>
                {examSet.title}
              </option>
            ))}
          </select>
        </label>
        <TextInput
          id="exam-session-title"
          name="title"
          label="Navn på hold/prøve"
          placeholder="Fx Indoor cycling, aprilholdet"
        />
        <TextInput
          id="exam-session-location"
          name="location"
          label="Sted"
          placeholder="Fx DGI Huset"
        />
        {!hasExamFormats ? (
          <p className="text-sm leading-6 text-danger">
            Der mangler et aktivt prøveformat. En superadmin skal oprette eller aktivere et format
            først.
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={!hasExamFormats}>
          Opret afholdelse
        </Button>
      </form>
    </Card>
  );
}

function ExamSessionList({
  sessions,
  isSuperAdminPreview,
}: {
  sessions: ExamSessionListItem[];
  isSuperAdminPreview: boolean;
}) {
  if (sessions.length === 0) {
    return (
      <Card
        title="Ingen afholdelser endnu"
        eyebrow="Overblik"
        titleClassName="text-[clamp(1.55rem,6vw,2.2rem)] leading-[1] tracking-[-0.02em]"
      >
        <p className="text-sm leading-7 text-muted-foreground">
          Når en afholdelse er oprettet, vises den her med deltagere, status og resultater.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Dine afholdelser"
      eyebrow="Fortsæt"
      titleClassName="text-[clamp(1.55rem,6vw,2.2rem)] leading-[1] tracking-[-0.02em]"
      className="space-y-3"
    >
      {sessions.map((examSession) => (
        <div
          key={examSession.id}
          className="rounded-[1rem] border border-border-soft bg-surface p-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{examSession.title}</p>
                <span className="rounded-full border border-border-soft bg-white/70 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {formatSessionStatus(examSession.status)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {examSession.examSetTitle} · {formatDate(examSession.startsAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                {examSession.invitationCount} deltagere · {examSession.completedAttemptCount}{" "}
                afleveret ·{" "}
                {examSession.passRate === null ? "ingen score endnu" : `${Math.round(examSession.passRate)}% bestået`}
              </p>
            </div>
            <Button
              href={getSessionHref(examSession.id, isSuperAdminPreview)}
              size="sm"
              variant={examSession.status === "CLOSED" ? "secondary" : "primary"}
              className="shrink-0"
            >
              {examSession.status === "CLOSED" ? "Se" : "Åbn"}
            </Button>
          </div>
        </div>
      ))}
    </Card>
  );
}

function InstructorSessionsOverview({
  sessionSnapshot,
  isSuperAdminPreview,
}: {
  sessionSnapshot: ExamSessionSnapshot;
  isSuperAdminPreview: boolean;
}) {
  const activeSessions = sessionSnapshot.sessions.filter(
    (examSession) => examSession.status !== "CLOSED",
  ).length;

  return (
    <div className="space-y-6 py-6 sm:py-8 lg:space-y-7 lg:py-8">
      {isSuperAdminPreview ? (
        <div className="flex justify-end">
          <Button href="/admin" variant="secondary" size="sm">
            Tilbage til superadmin
          </Button>
        </div>
      ) : null}

      <Card tone="strong" className="space-y-4 p-6 sm:p-7">
        <p className="kicker">
          {isSuperAdminPreview ? "Preview af instruktør" : "Mine prøveafholdelser"}
        </p>
        <h1 className="font-display text-[clamp(2rem,9vw,3.3rem)] leading-[0.98] uppercase tracking-[-0.035em]">
          Afholdelser
        </h1>
        <p className="content-copy text-base">
          Opret et hold, tilføj deltagere og åbn den afholdelse du vil styre under prøven.
        </p>
      </Card>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em]">Aktive</p>
          <p className="mt-2 font-display text-[2rem] leading-none">{activeSessions}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em]">Alle</p>
          <p className="mt-2 font-display text-[2rem] leading-none">
            {sessionSnapshot.sessions.length}
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em]">Formater</p>
          <p className="mt-2 font-display text-[2rem] leading-none">
            {sessionSnapshot.examSets.length}
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <ExamSessionCreateCard
          examSets={sessionSnapshot.examSets}
          isSuperAdminPreview={isSuperAdminPreview}
        />
        <ExamSessionList
          sessions={sessionSnapshot.sessions}
          isSuperAdminPreview={isSuperAdminPreview}
        />
      </section>
    </div>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const sessionSnapshot = await getExamSessionAdminSnapshot({
    adminUserId: session.id,
    includeAll: session.role === AdminRole.SUPER_ADMIN,
  });

  if (session.role !== AdminRole.SUPER_ADMIN || params.view === "instructor") {
    const isSuperAdminPreview = session.role === AdminRole.SUPER_ADMIN;
    const selectedExamSession = params.session
      ? sessionSnapshot.sessions.find((examSession) => examSession.id === params.session) ?? null
      : null;

    if (!selectedExamSession) {
      return (
        <InstructorSessionsOverview
          sessionSnapshot={sessionSnapshot}
          isSuperAdminPreview={isSuperAdminPreview}
        />
      );
    }

    const [dashboard, invitationSnapshot, reports] = await Promise.all([
      getAdminDashboardSnapshot({ examSessionId: selectedExamSession.id }),
      getAdminInvitationsSnapshot({ examSessionId: selectedExamSession.id }),
      getAdminReportsSnapshot({ examSessionId: selectedExamSession.id }),
    ]);

    if (!dashboard || !invitationSnapshot || !reports) {
      return (
        <div className="space-y-6 py-6 sm:py-8 lg:py-8">
          <Card tone="strong" className="space-y-4 p-6 sm:p-7">
            <p className="kicker">
              {session.role === AdminRole.SUPER_ADMIN ? "Testvisning" : "Instruktørflow"}
            </p>
            <h1 className="font-display text-[clamp(2.35rem,4.4vw,3.4rem)] leading-[0.96] uppercase tracking-[-0.04em]">
              Ingen aktiv prøve
            </h1>
            <p className="content-copy text-base">
              En superadmin skal først gøre en prøve aktiv. Derefter kan du uploade deltagere,
              starte afviklingen og følge resultaterne her.
            </p>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {session.role === AdminRole.SUPER_ADMIN ? (
          <div className="mx-auto flex w-full max-w-[58rem] justify-end">
            <Button href="/admin" variant="secondary" size="sm">
              Tilbage til superadmin
            </Button>
          </div>
        ) : null}
        <InstructorExamFlow
          dashboard={dashboard}
          invitations={invitationSnapshot}
          reports={reports}
          examSession={{
            id: selectedExamSession.id,
            title: selectedExamSession.title,
            status: selectedExamSession.status,
            closedAt: selectedExamSession.closedAt,
          }}
          basePath={getSessionHref(selectedExamSession.id, isSuperAdminPreview)}
          params={params}
        />
      </div>
    );
  }

  const [dashboard, invitationSnapshot] = await Promise.all([
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
                    href={`/admin?view=instructor&session=${examSession.id}`}
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
