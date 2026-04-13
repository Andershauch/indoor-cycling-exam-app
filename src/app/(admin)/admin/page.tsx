import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/ui/admin-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { logoutAdminAction } from "@/lib/admin/actions";
import { getAdminDashboardSnapshot } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

const attemptColumns = [
  { key: "participant", label: "Seneste forsøg" },
  { key: "status", label: "Status" },
  { key: "score", label: "Score", align: "right" as const },
];

const hardestQuestionColumns = [
  { key: "question", label: "Spørgsmål" },
  { key: "incorrect", label: "Forkerte", align: "right" as const },
];

function formatAttemptStatus(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "Afleveret";
    case "AUTO_SUBMITTED":
      return "Auto-afleveret";
    default:
      return "I gang";
  }
}

export default async function AdminDashboardPage() {
  const snapshot = await getAdminDashboardSnapshot();

  if (!snapshot) {
    return (
      <div className="slide-grid space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="Admin"
          title="INGEN AKTIV PRØVE"
          description="Importér eller opret først en aktiv prøve, før dashboard og invitationer kan bruges."
        />
      </div>
    );
  }

  const recentAttemptRows = snapshot.recentAttempts.map((attempt) => ({
    participant: (
      <div className="space-y-1">
        <p className="font-bold">{attempt.participantName || "Ukendt deltager"}</p>
        <p className="text-xs text-muted-foreground">
          {attempt.participantEmail || "Ingen e-mail"}
        </p>
      </div>
    ),
    status: formatAttemptStatus(attempt.status),
    score:
      attempt.scorePercentage === null ? "—" : `${Math.round(attempt.scorePercentage)}%`,
  }));

  const hardestQuestionRows = snapshot.hardestQuestions.map((question) => ({
    question: (
      <div className="space-y-1">
        <p className="font-bold">Spørgsmål {question.position}</p>
        <p className="text-sm text-muted-foreground">{question.questionText}</p>
      </div>
    ),
    incorrect: String(question.incorrectCount),
  }));

  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="ADMIN OVERBLIK"
        description="Arbejd fra desktop med én tydelig driftsflade: spørgsmål, invitationer og rapporter samlet omkring den aktive prøve."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button href="/questions" variant="secondary" size="lg">
              Spørgsmål
            </Button>
            <Button href="/invitations" size="lg">
              Invitationer
            </Button>
            <form action={logoutAdminAction}>
              <Button type="submit" variant="secondary" size="lg">
                Log ud
              </Button>
            </form>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard
          label="Spørgsmål"
          value={String(snapshot.exam.questionCount)}
          helper="Fast rækkefølge i aktiv prøve."
        />
        <AdminStatCard
          label="Forsøg"
          value={String(snapshot.stats.totalAttempts)}
          helper="Alle registrerede deltagerforsøg."
        />
        <AdminStatCard
          label="Bestået %"
          value={
            snapshot.reportStats.passRate === null
              ? "—"
              : `${Math.round(snapshot.reportStats.passRate)}%`
          }
          helper="Kun afleverede forsøg."
        />
        <AdminStatCard
          label="Snit"
          value={
            snapshot.reportStats.averageScore === null
              ? "—"
              : `${Math.round(snapshot.reportStats.averageScore)}%`
          }
          helper="Gennemsnitlig score."
        />
        <AdminStatCard
          label="Invitationer"
          value={String(snapshot.invitationStats.total)}
          helper="Oprettet via adminområdet."
        />
        <AdminStatCard
          label="Gennemført"
          value={String(snapshot.invitationStats.completed)}
          helper="Invitationer med afsluttet prøve."
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr_0.8fr]">
        <Card title="Aktiv prøve" eyebrow="Status" className="space-y-5">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Titel</dt>
              <dd>{snapshot.exam.title}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Version</dt>
              <dd>{snapshot.exam.version}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Varighed</dt>
              <dd>{snapshot.exam.timeLimitMinutes} minutter</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Bestået</dt>
              <dd>{snapshot.exam.passPercentage}%</dd>
            </div>
          </dl>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button href="/questions" size="lg">
              Redigér spørgsmål
            </Button>
            <Button href="/reports" variant="secondary" size="lg">
              Se rapporter
            </Button>
          </div>
        </Card>

        <Card title="Invitationer" eyebrow="Statusspor" className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Created</dt>
              <dd>{snapshot.invitationStats.created}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Sent</dt>
              <dd>{snapshot.invitationStats.sent}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Opened</dt>
              <dd>{snapshot.invitationStats.opened}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Completed</dt>
              <dd>{snapshot.invitationStats.completed}</dd>
            </div>
          </dl>
          <p className="text-sm leading-7 text-muted-foreground">
            Batch-upload fra Excel ligger under invitationer og importerer kun deltagernes navn og e-mail.
          </p>
          <Button href="/invitations" size="lg">
            Åbn invitationer
          </Button>
        </Card>

        <Card title="Ofte forkerte" eyebrow="Fokusområder" className="space-y-4">
          <AdminTable
            caption="Ofte forkerte spørgsmål"
            columns={hardestQuestionColumns}
            rows={hardestQuestionRows}
            emptyMessage="Der er endnu ikke nok afleverede forsøg."
          />
        </Card>
      </section>

      <AdminTable
        caption="Seneste forsøg"
        columns={attemptColumns}
        rows={recentAttemptRows}
        emptyMessage="Ingen deltagerforsøg endnu."
      />
    </div>
  );
}
