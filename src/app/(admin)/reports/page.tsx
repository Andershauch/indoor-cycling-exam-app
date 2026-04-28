import { AdminRole } from "@prisma/client";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/ui/admin-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdminSession } from "@/lib/admin/auth";
import { TextInput } from "@/components/ui/text-input";
import { getAdminReportsSnapshot, getExamSessionAdminSnapshot } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{
    query?: string;
    examSessionId?: string;
    examSetId?: string;
    adminUserId?: string;
    outcome?: "all" | "passed" | "failed";
    status?: "all" | "submitted" | "auto_submitted" | "in_progress";
  }>;
};

const columns = [
  { key: "participant", label: "Deltager" },
  { key: "context", label: "Afholdelse" },
  { key: "result", label: "Resultat" },
  { key: "status", label: "Status" },
  { key: "submitted", label: "Afleveret" },
];

const hardestQuestionColumns = [
  { key: "question", label: "Spørgsmål" },
  { key: "wrong", label: "Forkerte", align: "right" as const },
  { key: "rate", label: "Fejlrate", align: "right" as const },
];

const sessionSummaryColumns = [
  { key: "session", label: "Afholdelse" },
  { key: "instructor", label: "Instruktør" },
  { key: "numbers", label: "Tal" },
  { key: "score", label: "Score" },
  { key: "actions", label: "Handling", align: "right" as const },
];

const instructorSummaryColumns = [
  { key: "instructor", label: "Instruktør" },
  { key: "sessions", label: "Afholdelser", align: "right" as const },
  { key: "completed", label: "Afleveret", align: "right" as const },
  { key: "score", label: "Score", align: "right" as const },
];

function formatDate(value: Date | null) {
  if (!value) {
    return "Ikke afleveret";
  }

  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatStatus(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "Afleveret";
    case "AUTO_SUBMITTED":
      return "Auto-afleveret";
    default:
      return "I gang";
  }
}

function formatSessionStatus(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Aktiv";
    case "CLOSED":
      return "Afsluttet";
    case "DRAFT":
      return "Kladde";
    default:
      return status;
  }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await requireAdminSession(AdminRole.SUPER_ADMIN);
  const filters = await searchParams;
  const [snapshot, sessionSnapshot] = await Promise.all([
    getAdminReportsSnapshot(filters),
    getExamSessionAdminSnapshot({ includeAll: true }),
  ]);

  if (!snapshot) {
    return (
      <div className="space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="Samlede rapporter"
          title="Ingen rapportdata endnu"
          titleClassName="text-[clamp(1.9rem,4vw,3rem)] leading-[0.98] tracking-[-0.03em]"
          description="Når der findes afleverede forsøg, kan resultater og eksport samles her."
          descriptionClassName="max-w-3xl"
        />
      </div>
    );
  }

  const examSetOptions = Array.from(
    new Map(
      [
        ...sessionSnapshot.examSets.map((examSet) => [examSet.id, examSet.title] as const),
        ...sessionSnapshot.sessions.map(
          (examSession) => [examSession.examSetId, examSession.examSetTitle] as const,
        ),
      ].filter(([id]) => Boolean(id)),
    ),
  ).map(([id, title]) => ({ id, title }));
  const instructorOptions = Array.from(
    new Map(
      sessionSnapshot.sessions
        .map((examSession) =>
          examSession.createdByAdmin
            ? [
                examSession.createdByAdmin.id,
                {
                  id: examSession.createdByAdmin.id,
                  name: examSession.createdByAdmin.name,
                  email: examSession.createdByAdmin.email,
                },
              ] as const
            : null,
        )
        .filter((entry): entry is readonly [string, { id: string; name: string; email: string }] =>
          Boolean(entry),
        ),
    ),
  ).map(([, instructor]) => instructor);

  const rows = snapshot.attempts.map((attempt) => ({
    participant: (
      <div className="space-y-1">
        <p className="font-bold">{attempt.participantName || "Ukendt deltager"}</p>
        <p className="text-xs text-muted-foreground">
          {attempt.participantEmail || attempt.participantPhone || "Ingen kontaktinfo"}
        </p>
      </div>
    ),
    context: (
      <div className="space-y-1">
        <p className="font-bold">{attempt.examSessionTitle}</p>
        <p className="text-xs text-muted-foreground">{attempt.examSetTitle}</p>
        <p className="text-xs text-muted-foreground">
          {attempt.instructorName || attempt.instructorEmail || "Ingen instruktør"}
        </p>
      </div>
    ),
    result:
      attempt.scorePercentage === null
        ? "Afventer"
        : `${Math.round(attempt.scorePercentage)}% (${attempt.correctAnswerCount ?? 0}/${attempt.totalQuestionCount ?? 0})`,
    status: (
      <div className="space-y-1">
        <p className="font-bold">{formatStatus(attempt.status)}</p>
        <p className="text-xs text-muted-foreground">
          {attempt.passed === null ? "Ikke afsluttet" : attempt.passed ? "Bestået" : "Ikke bestået"}
        </p>
      </div>
    ),
    submitted: formatDate(attempt.submittedAt),
  }));

  const hardestQuestionRows = snapshot.hardestQuestions.map((question) => ({
    question: (
      <div className="space-y-1">
        <p className="font-bold">Spørgsmål {question.position}</p>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {question.examSetTitle}
        </p>
        <p className="text-sm text-muted-foreground">{question.questionText}</p>
      </div>
    ),
    wrong: String(question.incorrectCount),
    rate: `${Math.round(question.incorrectRate)}%`,
  }));
  const sessionSummaryRows = snapshot.sessionSummaries.map((examSession) => ({
    session: (
      <div className="space-y-1">
        <p className="font-bold">{examSession.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatSessionStatus(examSession.status)} · {formatDate(examSession.startsAt)}
        </p>
      </div>
    ),
    instructor: (
      <div className="space-y-1">
        <p className="font-bold">{examSession.instructorName ?? "Ukendt"}</p>
        <p className="text-xs text-muted-foreground">
          {examSession.instructorEmail ?? "Ingen e-mail"}
        </p>
      </div>
    ),
    numbers: (
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>{examSession.totalAttempts} forsøg</p>
        <p>{examSession.completedAttempts} afleveret</p>
        <p>{examSession.passedAttempts} bestået</p>
      </div>
    ),
    score: (
      <div className="space-y-1">
        <p className="font-bold">
          {examSession.passRate === null ? "Afventer" : `${Math.round(examSession.passRate)}% bestået`}
        </p>
        <p className="text-xs text-muted-foreground">
          {examSession.averageScore === null
            ? "Intet gennemsnit"
            : `${Math.round(examSession.averageScore)}% i snit`}
        </p>
      </div>
    ),
    actions:
      examSession.id === "missing-session" ? (
        <span className="text-xs text-muted-foreground">Ingen handling</span>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            href={`/admin/sessions/${examSession.id}?view=instructor`}
            variant="secondary"
            size="sm"
          >
            Åbn
          </Button>
          <Button href={`/reports?examSessionId=${examSession.id}`} variant="secondary" size="sm">
            Filtrer
          </Button>
        </div>
      ),
  }));
  const instructorSummaryRows = snapshot.instructorSummaries.map((instructor) => ({
    instructor: (
      <div className="space-y-1">
        <p className="font-bold">{instructor.name}</p>
        <p className="text-xs text-muted-foreground">{instructor.email}</p>
      </div>
    ),
    sessions: String(instructor.sessionCount),
    completed: `${instructor.completedAttempts}/${instructor.totalAttempts}`,
    score: (
      <div className="space-y-1">
        <p className="font-bold">
          {instructor.passRate === null ? "Afventer" : `${Math.round(instructor.passRate)}%`}
        </p>
        <p className="text-xs text-muted-foreground">
          {instructor.averageScore === null
            ? "Intet snit"
            : `${Math.round(instructor.averageScore)}% snit`}
        </p>
      </div>
    ),
  }));

  const csvParams = new URLSearchParams();

  if (snapshot.filters.examSessionId) {
    csvParams.set("examSessionId", snapshot.filters.examSessionId);
  }
  if (snapshot.filters.examSetId) {
    csvParams.set("examSetId", snapshot.filters.examSetId);
  }
  if (snapshot.filters.adminUserId) {
    csvParams.set("adminUserId", snapshot.filters.adminUserId);
  }
  if (snapshot.filters.query) {
    csvParams.set("query", snapshot.filters.query);
  }
  if (snapshot.filters.outcome !== "all") {
    csvParams.set("outcome", snapshot.filters.outcome);
  }
  if (snapshot.filters.status !== "all") {
    csvParams.set("status", snapshot.filters.status);
  }

  return (
    <div className="space-y-6 py-6 sm:py-8 lg:space-y-7 lg:py-8">
      <PageHeader
        eyebrow="Samlede rapporter"
        title="Rapporter"
        titleClassName="text-[clamp(2rem,4.4vw,3.2rem)] leading-[0.98] tracking-[-0.035em]"
        description="Se resultater på tværs af prøveafholdelser, instruktører og prøveformater. Eksporten indeholder samme kontekst som tabellen."
        descriptionClassName="max-w-3xl"
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              href={`/reports/export${csvParams.toString() ? `?${csvParams.toString()}` : ""}`}
              size="lg"
            >
              Eksporter CSV
            </Button>
          </div>
        }
      />

      <Card
        title="Filtrering"
        eyebrow="Find de rigtige resultater"
        titleClassName="text-[clamp(1.8rem,3.6vw,2.5rem)] leading-[0.98] tracking-[-0.03em]"
      >
        <form action="/reports" className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-[0.08em]">Afholdelse</span>
            <select
              name="examSessionId"
              defaultValue={snapshot.filters.examSessionId}
              className="min-h-12 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 text-base text-foreground focus-visible:outline-none"
            >
              <option value="">Alle</option>
              {sessionSnapshot.sessions.map((examSession) => (
                <option key={examSession.id} value={examSession.id}>
                  {examSession.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-[0.08em]">Prøveformat</span>
            <select
              name="examSetId"
              defaultValue={snapshot.filters.examSetId}
              className="min-h-12 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 text-base text-foreground focus-visible:outline-none"
            >
              <option value="">Alle</option>
              {examSetOptions.map((examSet) => (
                <option key={examSet.id} value={examSet.id}>
                  {examSet.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-[0.08em]">Instruktør</span>
            <select
              name="adminUserId"
              defaultValue={snapshot.filters.adminUserId}
              className="min-h-12 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 text-base text-foreground focus-visible:outline-none"
            >
              <option value="">Alle</option>
              {instructorOptions.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name} · {instructor.email}
                </option>
              ))}
            </select>
          </label>

          <TextInput
            id="reports-query"
            name="query"
            label="Søg"
            defaultValue={snapshot.filters.query}
            placeholder="Navn, e-mail eller telefon"
          />

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-[0.08em]">Udfald</span>
            <select
              name="outcome"
              defaultValue={snapshot.filters.outcome}
              className="min-h-12 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 text-base text-foreground focus-visible:outline-none"
            >
              <option value="all">Alle</option>
              <option value="passed">Bestået</option>
              <option value="failed">Ikke bestået</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-[0.08em]">Status</span>
            <select
              name="status"
              defaultValue={snapshot.filters.status}
              className="min-h-12 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 text-base text-foreground focus-visible:outline-none"
            >
              <option value="all">Alle</option>
              <option value="submitted">Afleveret</option>
              <option value="auto_submitted">Auto-afleveret</option>
              <option value="in_progress">I gang</option>
            </select>
          </label>

          <div className="flex items-end gap-3">
            <Button type="submit" size="lg">
              Filtrer
            </Button>
            <Button href="/reports" variant="secondary" size="lg">
              Nulstil
            </Button>
          </div>
        </form>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard label="Forsøg" value={String(snapshot.stats.totalAttempts)} />
        <AdminStatCard label="Færdige" value={String(snapshot.stats.completedAttempts)} />
        <AdminStatCard
          label="Bestået %"
          value={snapshot.stats.passRate === null ? "Afventer" : `${Math.round(snapshot.stats.passRate)}%`}
        />
        <AdminStatCard
          label="Gennemsnit"
          value={snapshot.stats.averageScore === null ? "Afventer" : `${Math.round(snapshot.stats.averageScore)}%`}
        />
        <AdminStatCard label="Bestået" value={String(snapshot.stats.passedAttempts)} />
        <AdminStatCard label="Auto" value={String(snapshot.stats.autoSubmittedAttempts)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          title="Afholdelser på tværs"
          eyebrow="Sammenligning"
          titleClassName="text-[clamp(1.9rem,3.8vw,2.7rem)] leading-[0.97] tracking-[-0.03em]"
          className="space-y-4"
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Brug oversigten til at sammenligne hold, instruktører og resultater før du åbner den
            detaljerede deltagerliste.
          </p>
          <AdminTable
            caption="Afholdelser på tværs"
            columns={sessionSummaryColumns}
            rows={sessionSummaryRows}
            emptyMessage="Ingen afholdelser matcher det valgte filter."
          />
        </Card>

        <Card
          title="Instruktører"
          eyebrow="Opsamling"
          titleClassName="text-[clamp(1.9rem,3.8vw,2.7rem)] leading-[0.97] tracking-[-0.03em]"
          className="space-y-4"
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Samlet billede af afholdelser, afleveringer og score pr. instruktør.
          </p>
          <AdminTable
            caption="Instruktører"
            columns={instructorSummaryColumns}
            rows={instructorSummaryRows}
            emptyMessage="Ingen instruktørdata matcher det valgte filter."
          />
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminTable
          caption="Resultatoversigt"
          columns={columns}
          rows={rows}
          emptyMessage="Ingen forsøg matcher det valgte filter."
        />

        <Card
          title="Spørgsmål der driller"
          eyebrow="Læringsmønstre"
          titleClassName="text-[clamp(1.9rem,3.8vw,2.7rem)] leading-[0.97] tracking-[-0.03em]"
          className="space-y-4"
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Listen er baseret på afleverede forsøg og viser de spørgsmål, som oftest bliver
            besvaret forkert.
          </p>
          <AdminTable
            caption="Spørgsmål der driller"
            columns={hardestQuestionColumns}
            rows={hardestQuestionRows}
            emptyMessage="Der er endnu ikke nok afleverede forsøg til at vise mønstre."
          />
        </Card>
      </section>
    </div>
  );
}
