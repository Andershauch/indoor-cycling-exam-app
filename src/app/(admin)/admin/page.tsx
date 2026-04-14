import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/ui/admin-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TextInput } from "@/components/ui/text-input";
import {
  createBatchInvitationsAction,
  createInvitationAction,
  logoutAdminAction,
} from "@/lib/admin/actions";
import { getAdminDashboardSnapshot, getAdminReportsSnapshot } from "@/lib/admin/data";
import { getAdminInvitationsSnapshot } from "@/lib/invitations/service";

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

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [params, dashboard, invitationSnapshot, reports] = await Promise.all([
    searchParams,
    getAdminDashboardSnapshot(),
    getAdminInvitationsSnapshot(),
    getAdminReportsSnapshot(),
  ]);

  if (!dashboard || !invitationSnapshot || !reports) {
    return (
      <div className="slide-grid space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="Admin"
          title="INGEN AKTIV PRØVE"
          description="Importér eller opret først en aktiv prøve, før deltagere og resultater kan styres her."
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
          <p className="text-xs text-muted-foreground">
            Sendt: {formatDate(invitation.sentAt)}
          </p>
        </div>
      ),
      result: scoreLabel,
      actions: (
        <div className="flex flex-wrap justify-end gap-2">
          <Button href={invitation.invitationLink} variant="secondary" size="sm">
            Link
          </Button>
          {invitation.latestAttemptId ? (
            <Button href={`/result/${invitation.latestAttemptId}`} size="sm">
              Resultat
            </Button>
          ) : null}
        </div>
      ),
    };
  });

  const resultRows = reports.attempts.slice(0, 8).map((attempt) => ({
    participant: (
      <div className="space-y-1">
        <p className="font-bold">{attempt.participantName || "Ukendt deltager"}</p>
        <p className="text-xs text-muted-foreground">
          {attempt.participantEmail || "Ingen e-mail"}
        </p>
      </div>
    ),
    score:
      attempt.scorePercentage === null
        ? "—"
        : `${Math.round(attempt.scorePercentage)}%`,
    submitted: formatDate(attempt.submittedAt),
    actions: (
      <Button href={`/result/${attempt.id}`} variant="secondary" size="sm">
        Åbn
      </Button>
    ),
  }));

  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="DELTAGERE, STATUS OG RESULTATER"
        description="Det er her forløbet styres. Upload deltagerlisten, send prøvelinks og følg hvem der er sendt til, i gang og færdige."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button href="/questions" variant="secondary" size="lg">
              Spørgsmål
            </Button>
            <Button href="/reports" variant="secondary" size="lg">
              Alle rapporter
            </Button>
            <form action={logoutAdminAction}>
              <Button type="submit" variant="secondary" size="lg">
                Log ud
              </Button>
            </form>
          </div>
        }
      />

      {params.batchOk ? (
        <Card tone="strong" title="Batch-upload gennemført" eyebrow="Importstatus">
          <p className="text-base leading-7 text-foreground">
            Oprettet: {params.created ?? "0"} · Fejlet: {params.failed ?? "0"} · Ignoreret:
            {" "}
            {params.ignored ?? "0"}
          </p>
        </Card>
      ) : null}

      {params.batchError ? (
        <Card title="Batch-upload kunne ikke gennemføres" eyebrow="Fejl">
          <p className="text-base leading-7 text-danger">{params.batchError}</p>
        </Card>
      ) : null}

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

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="1. Upload deltagerliste" eyebrow="Batch fra Excel" className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            Upload Excel-filen med deltagerne. Systemet læser kun kolonnerne
            <strong> Fulde navn</strong> og <strong>E-mailadresse</strong> og ignorerer resten.
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
        </Card>

        <Card title="2. Tilføj én deltager" eyebrow="Manuel fallback" className="space-y-4">
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
      </section>

      <Card title="3. Deltagerliste og status" eyebrow="Live overblik" className="space-y-4">
        <AdminTable
          caption="Deltagere og status"
          columns={participantColumns}
          rows={participantRows}
          emptyMessage="Der er endnu ingen deltagere oprettet."
        />
      </Card>

      <Card title="4. Seneste resultater" eyebrow="Afleverede prøver" className="space-y-4">
        <AdminTable
          caption="Seneste resultater"
          columns={resultColumns}
          rows={resultRows}
          emptyMessage="Ingen afleverede prøver endnu."
        />
      </Card>
    </div>
  );
}
