import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/ui/admin-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { logoutAdminAction } from "@/lib/admin/actions";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminDashboardSnapshot, getAdminReportsSnapshot } from "@/lib/admin/data";
import { getAdminInvitationsSnapshot } from "@/lib/invitations/service";

export const dynamic = "force-dynamic";

const participantColumns = [
  { key: "participant", label: "Deltager" },
  { key: "status", label: "Status" },
  { key: "result", label: "Resultat" },
  { key: "actions", label: "Handling", align: "right" as const },
];

const resultColumns = [
  { key: "participant", label: "Seneste resultater" },
  { key: "score", label: "Score" },
  { key: "submitted", label: "Afleveret" },
  { key: "actions", label: "Vis", align: "right" as const },
];

function formatDate(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatParticipantStatus(input: {
  invitationStatus: string;
  latestAttemptStatus: string | null;
}) {
  if (input.latestAttemptStatus === "IN_PROGRESS") {
    return "I gang";
  }

  if (input.latestAttemptStatus === "SUBMITTED" || input.latestAttemptStatus === "AUTO_SUBMITTED") {
    return "Gennemført";
  }

  switch (input.invitationStatus) {
    case "CREATED":
      return "Oprettet";
    case "SENT":
      return "Sendt";
    case "OPENED":
      return "Åbnet";
    case "COMPLETED":
      return "Gennemført";
    case "EXPIRED":
      return "Udløbet";
    default:
      return input.invitationStatus;
  }
}

export default async function AdminStatusPage() {
  const [dashboard, invitationSnapshot, reports, adminSession] = await Promise.all([
    getAdminDashboardSnapshot(),
    getAdminInvitationsSnapshot(),
    getAdminReportsSnapshot(),
    getAdminSession(),
  ]);

  if (!dashboard || !invitationSnapshot || !reports) {
    return (
      <div className="slide-grid space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="Status"
          title="INGEN AKTIV PRØVE"
          description="Importér eller opret først en aktiv prøve, før status og resultater kan vises."
        />
      </div>
    );
  }

  const participantRows = invitationSnapshot.invitations.map((invitation) => {
    const statusLabel = formatParticipantStatus({
      invitationStatus: invitation.status,
      latestAttemptStatus: invitation.latestAttemptStatus,
    });

    const scoreLabel =
      invitation.latestAttemptScore === null ? "—" : `${Math.round(invitation.latestAttemptScore)}%`;

    return {
      participant: (
        <div className="space-y-1">
          <p className="font-bold">{invitation.recipientName || "Ukendt deltager"}</p>
          <p className="text-xs text-muted-foreground">
            {invitation.recipientEmail || "Ingen e-mail"}
          </p>
        </div>
      ),
      status: (
        <div className="space-y-1">
          <p className="font-bold">{statusLabel}</p>
          <p className="text-xs text-muted-foreground">Sendt: {formatDate(invitation.sentAt)}</p>
        </div>
      ),
      result: scoreLabel,
      actions: (
        <Button href={invitation.invitationLink} variant="secondary" size="sm">
          Link
        </Button>
      ),
    };
  });

  const resultRows = reports.attempts.slice(0, 10).map((attempt) => ({
    participant: (
      <div className="space-y-1">
        <p className="font-bold">{attempt.participantName || "Ukendt deltager"}</p>
        <p className="text-xs text-muted-foreground">
          {attempt.participantEmail || "Ingen e-mail"}
        </p>
      </div>
    ),
    score: attempt.scorePercentage === null ? "—" : `${Math.round(attempt.scorePercentage)}%`,
    submitted: formatDate(attempt.submittedAt),
    actions: (
      <Button href="/reports" variant="secondary" size="sm">
        Rapporter
      </Button>
    ),
  }));

  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Trin 2"
        title="FØLG PRØVEN LIGE NU"
        description="Her ser du, hvem der er sendt til, hvem der er i gang, og hvilke resultater der er kommet ind."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button href="/admin" variant="secondary" size="lg">
              Ny upload
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
            <Button href="/reports" variant="secondary" size="lg">
              Se rapporter
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Deltagere</p>
          <p className="font-display text-4xl">{invitationSnapshot.invitations.length}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Sendt</p>
          <p className="font-display text-4xl">{dashboard.invitationStats.sent}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Åbnet</p>
          <p className="font-display text-4xl">{dashboard.invitationStats.opened}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Gennemført</p>
          <p className="font-display text-4xl">{dashboard.invitationStats.completed}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Bestået %</p>
          <p className="font-display text-4xl">
            {dashboard.reportStats.passRate === null
              ? "—"
              : `${Math.round(dashboard.reportStats.passRate)}%`}
          </p>
        </Card>
      </section>

      <Card title="Deltagerliste og status" eyebrow="Live overblik" className="space-y-4">
        <AdminTable
          caption="Deltagere og status"
          columns={participantColumns}
          rows={participantRows}
          emptyMessage="Der er endnu ingen deltagere oprettet."
        />
      </Card>

      <Card title="Seneste resultater" eyebrow="Afleverede prøver" className="space-y-4">
        <AdminTable
          caption="Seneste resultater"
          columns={resultColumns}
          rows={resultRows}
          emptyMessage="Ingen afleverede prøver endnu."
        />
      </Card>

      <div className="flex justify-end">
        <form action={logoutAdminAction}>
          <Button type="submit" variant="secondary" size="sm">
            Log ud
          </Button>
        </form>
      </div>
    </div>
  );
}
