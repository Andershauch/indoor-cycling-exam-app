import { AdminRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextInput } from "@/components/ui/text-input";
import { createExamSessionAction } from "@/lib/admin/actions";
import { requireAdminSession } from "@/lib/admin/auth";
import { getExamSessionAdminSnapshot } from "@/lib/admin/data";

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
  return `/admin/sessions/${examSessionId}${isSuperAdminPreview ? "?view=instructor" : ""}`;
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
          <Button href="/superadmin" variant="secondary" size="sm">
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

  if (session.role === AdminRole.SUPER_ADMIN && params.view !== "instructor") {
    redirect("/superadmin");
  }

  if (params.session) {
    redirect(getSessionHref(params.session, session.role === AdminRole.SUPER_ADMIN) as never);
  }

  const sessionSnapshot = await getExamSessionAdminSnapshot({
    adminUserId: session.id,
    includeAll: session.role === AdminRole.SUPER_ADMIN,
  });

  const isSuperAdminPreview = session.role === AdminRole.SUPER_ADMIN;

  return (
    <InstructorSessionsOverview
      sessionSnapshot={sessionSnapshot}
      isSuperAdminPreview={isSuperAdminPreview}
    />
  );
}
