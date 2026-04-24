import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/ui/admin-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TextInput } from "@/components/ui/text-input";
import { logoutAdminAction } from "@/lib/admin/actions";
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
  { key: "question", label: "Sporgsmaal" },
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
  const filters = await searchParams;
  const snapshot = await getAdminReportsSnapshot(filters);

  if (!snapshot) {
    return (
      <div className="slide-grid space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="Rapporter"
          title="INGEN AKTIV PROEVE"
          description="Der findes endnu ingen aktiv proeve at rapportere paa."
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
          {attempt.passed === null ? "Ikke afsluttet" : attempt.passed ? "Bestaaet" : "Ikke bestaaet"}
        </p>
      </div>
    ),
    submitted: formatDate(attempt.submittedAt),
  }));

  const hardestQuestionRows = snapshot.hardestQuestions.map((question) => ({
    question: (
      <div className="space-y-1">
        <p className="font-bold">Sporgsmaal {question.position}</p>
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
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Rapporter"
        title="RESULTATER OG OVERBLIK"
        description="Brug denne side til hurtigt at se, hvem der er faerdige, hvem der stadig er i gang, og hvilke spoergsmaal der oftest giver problemer."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              href={`/reports/export${csvParams.toString() ? `?${csvParams.toString()}` : ""}`}
              size="lg"
            >
              Eksporter CSV
            </Button>
            <Button href="/admin/status" variant="secondary" size="lg">
              Aabn status
            </Button>
            <form action={logoutAdminAction}>
              <Button type="submit" variant="secondary" size="lg">
                Log ud
              </Button>
            </form>
          </div>
        }
      />

      <Card title="Filtrering" eyebrow="Find de rigtige resultater">
        <form action="/reports" className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
          <TextInput
            id="reports-query"
            name="query"
            label="Soeg"
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
              <option value="passed">Bestaaet</option>
              <option value="failed">Ikke bestaaet</option>
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
        <AdminStatCard label="Forsoeg" value={String(snapshot.stats.totalAttempts)} />
        <AdminStatCard label="Faerdige" value={String(snapshot.stats.completedAttempts)} />
        <AdminStatCard
          label="Bestaaet %"
          value={snapshot.stats.passRate === null ? "Afventer" : `${Math.round(snapshot.stats.passRate)}%`}
        />
        <AdminStatCard
          label="Gennemsnit"
          value={snapshot.stats.averageScore === null ? "Afventer" : `${Math.round(snapshot.stats.averageScore)}%`}
        />
        <AdminStatCard label="Bestaaet" value={String(snapshot.stats.passedAttempts)} />
        <AdminStatCard label="Auto" value={String(snapshot.stats.autoSubmittedAttempts)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminTable
          caption="Resultatoversigt"
          columns={columns}
          rows={rows}
          emptyMessage="Ingen forsoeg matcher det valgte filter."
        />

        <Card title="Spoergsmaal der driller" eyebrow="Laeringsmoenstre" className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Listen er baseret paa afleverede forsoeg og viser de spoergsmaal, som oftest bliver
            besvaret forkert. Brug den til hurtigt at se, hvor undervisningen eller spoergsmaalene
            skal justeres.
          </p>
          <AdminTable
            caption="Spoergsmaal der driller"
            columns={hardestQuestionColumns}
            rows={hardestQuestionRows}
            emptyMessage="Der er endnu ikke nok afleverede forsoeg til at vise moenstre."
          />
        </Card>
      </section>
    </div>
  );
}
