import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextInput } from "@/components/ui/text-input";
import {
  closeExamSessionAction,
  createBatchInvitationsAction,
  createInvitationAction,
} from "@/lib/admin/actions";
import type { getAdminDashboardSnapshot, getAdminReportsSnapshot } from "@/lib/admin/data";
import type { getAdminInvitationsSnapshot } from "@/lib/invitations/service";

type DashboardSnapshot = NonNullable<Awaited<ReturnType<typeof getAdminDashboardSnapshot>>>;
type InvitationSnapshot = NonNullable<Awaited<ReturnType<typeof getAdminInvitationsSnapshot>>>;
type ReportsSnapshot = NonNullable<Awaited<ReturnType<typeof getAdminReportsSnapshot>>>;

type InstructorExamFlowProps = {
  dashboard: DashboardSnapshot;
  invitations: InvitationSnapshot;
  reports: ReportsSnapshot;
  examSession?: {
    id: string;
    title: string;
    status: string;
    closedAt: Date | null;
  } | null;
  basePath?: string;
  params: {
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
  };
};

const panels = [
  { id: "adgang", label: "Adgang", step: "1" },
  { id: "deltagere", label: "Deltagere", step: "2" },
  { id: "start", label: "Start", step: "3" },
  { id: "status", label: "Status", step: "4" },
  { id: "resultater", label: "Resultater", step: "5" },
];

function formatDate(value: Date | null) {
  if (!value) {
    return "Ikke endnu";
  }

  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function getParticipantStatus(input: {
  invitationStatus: string;
  latestAttemptStatus: string | null;
}) {
  if (input.latestAttemptStatus === "IN_PROGRESS") {
    return { label: "I gang", tone: "bg-warning/15" };
  }

  if (input.latestAttemptStatus === "SUBMITTED" || input.latestAttemptStatus === "AUTO_SUBMITTED") {
    return { label: "Færdig", tone: "bg-success/15" };
  }

  if (input.invitationStatus === "OPENED") {
    return { label: "Åbnet", tone: "bg-background-soft" };
  }

  if (input.invitationStatus === "SENT") {
    return { label: "Sendt", tone: "bg-surface" };
  }

  if (input.invitationStatus === "EXPIRED") {
    return { label: "Udløbet", tone: "bg-danger/10" };
  }

  return { label: "Klar", tone: "bg-surface" };
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-border-soft bg-white/60 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words font-display text-[1.75rem] leading-none">{value}</p>
    </div>
  );
}

export function InstructorExamFlow({
  dashboard,
  invitations,
  reports,
  examSession,
  basePath = "/admin",
  params,
}: InstructorExamFlowProps) {
  const returnTo = examSession ? `${basePath}#deltagere` : "/admin#deltagere";
  const resultReturnTo = examSession
    ? `${basePath}#resultater`
    : "/admin#resultater";
  const isClosed = examSession?.status === "CLOSED";
  const completedAttempts = reports.attempts.filter(
    (attempt) => attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED",
  );
  const activeAttempts = reports.attempts.filter((attempt) => attempt.status === "IN_PROGRESS");
  const readyCount =
    invitations.invitations.length -
    dashboard.invitationStats.opened -
    dashboard.invitationStats.completed;

  return (
    <div className="instructor-flow py-3 sm:py-5 lg:py-8">
      <header className="space-y-4 px-1">
        <div className="space-y-2">
          <p className="kicker">Instruktørflow</p>
          <h1 className="font-display text-[clamp(2.35rem,12vw,4.7rem)] leading-[0.9] uppercase tracking-[-0.055em]">
            {isClosed ? "Prøven er afsluttet" : "Afhold prøven"}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            {examSession
              ? `Swipe mellem trinene for ${examSession.title}. Alt det praktiske til afviklingen ligger her.`
              : "Swipe mellem trinene. Alt det praktiske til afviklingen ligger her, så du kan styre prøven fra mobilen."}
          </p>
        </div>

        <nav
          aria-label="Instruktørflow trin"
          className="instructor-step-nav"
        >
          {panels.map((panel) => (
            <a key={panel.id} href={`#${panel.id}`} className="instructor-step-chip">
              <span>{panel.step}</span>
              {panel.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="instructor-snap-row mt-5" aria-label="Prøveafvikling">
        <section id="adgang" className="instructor-panel">
          <Card tone="strong" className="h-full space-y-5">
            <div className="space-y-3">
              <p className="kicker">1 · Magic link</p>
              <h2 className="font-display text-[clamp(2rem,10vw,3.35rem)] leading-[0.94] uppercase tracking-[-0.045em]">
                Du er inde
              </h2>
              <p className="text-base leading-7 text-muted-foreground">
                {isClosed
                  ? "Afholdelsen er lukket. Du kan stadig se status og resultater."
                  : "Magic linket giver dig adgang til den aktive prøve. Herfra skal du først gøre deltagerlisten klar."}
              </p>
            </div>
            <div className="grid gap-3">
              <StatPill label={examSession ? "Afholdelse" : "Aktiv prøve"} value={examSession?.title ?? dashboard.exam.title} />
              <StatPill label="Spørgsmål" value={String(dashboard.exam.questionCount)} />
              <StatPill label="Tid" value={`${dashboard.exam.timeLimitMinutes} min`} />
            </div>
            <Button href="#deltagere" size="lg" className="w-full">
              {isClosed ? "Se deltagere" : "Tilføj deltagere"}
            </Button>
          </Card>
        </section>

        <section id="deltagere" className="instructor-panel">
          <Card className="h-full space-y-5">
            <div className="space-y-3">
              <p className="kicker">2 · Deltagere</p>
              <h2 className="font-display text-[clamp(2rem,10vw,3.35rem)] leading-[0.94] uppercase tracking-[-0.045em]">
                Upload Excel
              </h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Upload filen med deltagere. Systemet bruger kolonnerne <strong>Fulde navn</strong>{" "}
                og <strong>E-mailadresse</strong>.
              </p>
            </div>

            {params.batchOk ? (
              <div className="rounded-[1rem] border border-border-soft bg-success/10 p-4 text-sm leading-6">
                Import gennemført: {params.created ?? "0"} oprettet, {params.failed ?? "0"} fejlet
                og {params.ignored ?? "0"} ignoreret.
              </div>
            ) : null}

            {params.batchError ? (
              <div className="rounded-[1rem] border border-danger/30 bg-danger/10 p-4 text-sm font-bold text-danger">
                {params.batchError}
              </div>
            ) : null}

            <form action={createBatchInvitationsAction} className="grid gap-4">
              <input type="hidden" name="returnTo" value={returnTo} />
              {examSession ? (
                <input type="hidden" name="examSessionId" value={examSession.id} />
              ) : null}
              <label className="grid gap-2">
                <span className="text-sm font-bold uppercase tracking-[0.08em]">Excel-fil</span>
                <input
                  type="file"
                  name="batchFile"
                  accept=".xlsx,.xls"
                  disabled={isClosed}
                  className="min-h-14 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 py-3 text-base text-foreground focus-visible:outline-none"
                />
              </label>
              <Button type="submit" size="lg" className="w-full" disabled={isClosed}>
                Upload og send links
              </Button>
            </form>

            <div className="border-t border-border-soft pt-5">
              {params.createOk ? (
                <div className="mb-4 rounded-[1rem] border border-border-soft bg-success/10 p-4 text-sm leading-6">
                  Invitationen er oprettet for {params.recipient ?? "deltageren"}.
                </div>
              ) : null}
              {params.createError ? (
                <div className="mb-4 rounded-[1rem] border border-danger/30 bg-danger/10 p-4 text-sm font-bold text-danger">
                  {params.createError}
                </div>
              ) : null}
              <form action={createInvitationAction} className="grid gap-4">
                <input type="hidden" name="returnTo" value={returnTo} />
                {examSession ? (
                  <input type="hidden" name="examSessionId" value={examSession.id} />
                ) : null}
                <input type="hidden" name="channel" value="EMAIL" />
                <TextInput
                  id="instructor-recipient-name"
                  name="recipientName"
                  label="Tilføj enkelt deltager"
                  placeholder="Navn"
                  disabled={isClosed}
                />
                <TextInput
                  id="instructor-recipient-email"
                  name="recipientEmail"
                  label="E-mail"
                  type="email"
                  placeholder="navn@example.com"
                  disabled={isClosed}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={isClosed}
                >
                  Send link
                </Button>
              </form>
              {isClosed ? (
                <p className="mt-4 rounded-[1rem] border border-border-soft bg-surface p-4 text-sm leading-6 text-muted-foreground">
                  Afholdelsen er afsluttet, så deltagerlisten er låst.
                </p>
              ) : null}
            </div>
          </Card>
        </section>

        <section id="start" className="instructor-panel">
          <Card tone="contrast" className="h-full space-y-5">
            <div className="space-y-3">
              <p className="kicker text-inverse-foreground">3 · Start</p>
              <h2 className="font-display text-[clamp(2.2rem,11vw,3.8rem)] leading-[0.9] uppercase tracking-[-0.055em]">
                Start prøven
              </h2>
              <p className="text-base leading-7 text-inverse-foreground/80">
                Når deltagerne har deres links, beder du dem åbne prøven. Timeren starter for den
                enkelte deltager, når deres forsøg oprettes.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Deltagere" value={String(invitations.invitations.length)} />
              <StatPill label="Sendt" value={String(dashboard.invitationStats.sent)} />
            </div>
            <div className="rounded-[1rem] border border-white/20 bg-white/10 p-4 text-sm leading-6">
              Sig højt: Åbn linket, skriv ikke om på URL’en, og aflever først når alle spørgsmål er
              besvaret.
            </div>
            <Button href="#status" variant="contrast" size="lg" className="w-full">
              Følg status
            </Button>
          </Card>
        </section>

        <section id="status" className="instructor-panel">
          <Card className="h-full space-y-5">
            <div className="space-y-3">
              <p className="kicker">4 · Live status</p>
              <h2 className="font-display text-[clamp(2rem,10vw,3.35rem)] leading-[0.94] uppercase tracking-[-0.045em]">
                Undervejs
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Klar" value={String(Math.max(readyCount, 0))} />
              <StatPill label="I gang" value={String(activeAttempts.length)} />
              <StatPill label="Åbnet" value={String(dashboard.invitationStats.opened)} />
              <StatPill label="Færdige" value={String(completedAttempts.length)} />
            </div>
            <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1">
              {invitations.invitations.length === 0 ? (
                <p className="rounded-[1rem] border border-border-soft bg-surface p-4 text-sm text-muted-foreground">
                  Der er endnu ingen deltagere.
                </p>
              ) : (
                invitations.invitations.map((invitation) => {
                  const status = getParticipantStatus({
                    invitationStatus: invitation.status,
                    latestAttemptStatus: invitation.latestAttemptStatus,
                  });

                  return (
                    <div
                      key={invitation.id}
                      className="rounded-[1rem] border border-border-soft bg-white/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold">
                            {invitation.recipientName || "Ukendt deltager"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {invitation.recipientEmail || "Ingen e-mail"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border border-border-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] ${status.tone}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Button href="#resultater" size="lg" className="w-full">
              Se resultater
            </Button>
          </Card>
        </section>

        <section id="resultater" className="instructor-panel">
          <Card tone="strong" className="h-full space-y-5">
            <div className="space-y-3">
              <p className="kicker">5 · Resultater</p>
              <h2 className="font-display text-[clamp(2rem,10vw,3.35rem)] leading-[0.94] uppercase tracking-[-0.045em]">
                Efter prøven
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Afleveret" value={String(reports.stats.completedAttempts)} />
              <StatPill
                label="Bestået"
                value={
                  reports.stats.passRate === null ? "-" : `${Math.round(reports.stats.passRate)}%`
                }
              />
              <StatPill
                label="Snit"
                value={
                  reports.stats.averageScore === null
                    ? "-"
                    : `${Math.round(reports.stats.averageScore)}%`
                }
              />
              <StatPill label="Ikke bestået" value={String(reports.stats.failedAttempts)} />
            </div>
            <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1">
              {completedAttempts.length === 0 ? (
                <p className="rounded-[1rem] border border-border-soft bg-surface p-4 text-sm text-muted-foreground">
                  Resultaterne vises her, når de første deltagere afleverer.
                </p>
              ) : (
                completedAttempts.slice(0, 12).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="rounded-[1rem] border border-border-soft bg-white/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {attempt.participantName || "Ukendt deltager"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(attempt.submittedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-3xl leading-none">
                          {attempt.scorePercentage === null
                            ? "-"
                            : `${Math.round(attempt.scorePercentage)}%`}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-[0.08em]">
                          {attempt.passed ? "Bestået" : "Ikke bestået"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {params.closed ? (
              <p className="rounded-[1rem] border border-border-soft bg-success/10 p-4 text-sm leading-6">
                Afholdelsen er afsluttet og indgår nu i rapporteringen.
              </p>
            ) : null}
            {params.closeError ? (
              <p className="rounded-[1rem] border border-danger/30 bg-danger/10 p-4 text-sm font-bold text-danger">
                {params.closeError}
              </p>
            ) : null}
            <Button
              href={
                examSession
                  ? `/reports/export?examSessionId=${examSession.id}`
                  : "/reports/export"
              }
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Eksporter CSV
            </Button>
            {examSession ? (
              isClosed ? (
                <p className="rounded-[1rem] border border-border-soft bg-surface p-4 text-sm leading-6 text-muted-foreground">
                  Afsluttet {formatDate(examSession.closedAt)}.
                </p>
              ) : (
                <form action={closeExamSessionAction} className="grid gap-3">
                  <input type="hidden" name="examSessionId" value={examSession.id} />
                  <input type="hidden" name="returnTo" value={resultReturnTo} />
                  <Button
                    type="submit"
                    variant="contrast"
                    size="lg"
                    className="w-full"
                    disabled={activeAttempts.length > 0}
                  >
                    Afslut prøve
                  </Button>
                  {activeAttempts.length > 0 ? (
                    <p className="text-sm leading-6 text-muted-foreground">
                      Afholdelsen kan afsluttes, når ingen deltagere er i gang.
                    </p>
                  ) : null}
                </form>
              )
            ) : null}
          </Card>
        </section>
      </div>
    </div>
  );
}
