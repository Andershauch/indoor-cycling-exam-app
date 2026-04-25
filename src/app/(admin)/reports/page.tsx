import { AdminRole } from "@prisma/client";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/ui/admin-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdminSession } from "@/lib/admin/auth";
import { TextInput } from "@/components/ui/text-input";
import { getAdminReportsSnapshot } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{
    query?: string;
    outcome?: "all" | "passed" | "failed";
    status?: "all" | "submitted" | "auto_submitted" | "in_progress";
  }>;
};

const columns = [
  { key: "participant", label: "Deltager" },
  { key: "result", label: "Resultat" },
  { key: "status", label: "Status" },
  { key: "submitted", label: "Afleveret" },
];

const hardestQuestionColumns = [
  { key: "question", label: "Spørgsmål" },
  { key: "wrong", label: "Forkerte", align: "right" as const },
  { key: "rate", label: "Fejlrate", align: "right" as const },
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

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await requireAdminSession(AdminRole.SUPER_ADMIN);
  const filters = await searchParams;
  const snapshot = await getAdminReportsSnapshot(filters);

  if (!snapshot) {
    return (
      <div className="space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="Rapporter"
          title="Ingen aktiv prøve"
          titleClassName="text-[clamp(2rem,4.5vw,3.2rem)] leading-[0.96] tracking-[-0.04em]"
          description="Der findes endnu ingen aktiv prøve at rapportere på."
          descriptionClassName="max-w-3xl"
        />
      </div>
    );
  }

  const rows = snapshot.attempts.map((attempt) => ({
    participant: (
      <div className="space-y-1">
        <p className="font-bold">{attempt.participantName || "Ukendt deltager"}</p>
        <p className="text-xs text-muted-foreground">
          {attempt.participantEmail || attempt.participantPhone || "Ingen kontaktinfo"}
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
        <p className="text-sm text-muted-foreground">{question.questionText}</p>
      </div>
    ),
    wrong: String(question.incorrectCount),
    rate: `${Math.round(question.incorrectRate)}%`,
  }));

  const csvParams = new URLSearchParams();

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
        eyebrow="Efter prøven"
        title="Resultater og rapporter"
        titleClassName="text-[clamp(2.15rem,5vw,3.55rem)] leading-[0.96] tracking-[-0.045em]"
        description="Brug denne side bagefter til at se resultater, filtrere forsøg og eksportere data."
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
        <form action="/reports" className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
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
