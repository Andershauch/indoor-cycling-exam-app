import { AdminRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/ui/admin-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdminSession } from "@/lib/admin/auth";
import { getExamSessionAdminSnapshot } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

const columns = [
  { key: "session", label: "Afholdelse" },
  { key: "instructor", label: "Instruktør" },
  { key: "status", label: "Status" },
  { key: "numbers", label: "Tal" },
  { key: "actions", label: "Handling", align: "right" as const },
];

function formatDate(value: Date | null) {
  if (!value) {
    return "Ikke sat";
  }

  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatStatus(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Aktiv";
    case "CLOSED":
      return "Afsluttet";
    default:
      return "Kladde";
  }
}

export default async function AdminStatusPage() {
  await requireAdminSession(AdminRole.SUPER_ADMIN);
  const snapshot = await getExamSessionAdminSnapshot({ includeAll: true });

  const activeCount = snapshot.sessions.filter((session) => session.status === "ACTIVE").length;
  const closedCount = snapshot.sessions.filter((session) => session.status === "CLOSED").length;
  const participantCount = snapshot.sessions.reduce(
    (sum, session) => sum + session.invitationCount,
    0,
  );
  const completedCount = snapshot.sessions.reduce(
    (sum, session) => sum + session.completedAttemptCount,
    0,
  );

  const rows = snapshot.sessions.map((examSession) => ({
    session: (
      <div className="space-y-1">
        <p className="font-bold">{examSession.title}</p>
        <p className="text-xs text-muted-foreground">
          {examSession.examSetTitle} · {formatDate(examSession.startsAt)}
        </p>
      </div>
    ),
    instructor: (
      <div className="space-y-1">
        <p className="font-bold">{examSession.createdByAdmin?.name ?? "Ukendt"}</p>
        <p className="text-xs text-muted-foreground">
          {examSession.createdByAdmin?.email ?? "Ingen e-mail"}
        </p>
      </div>
    ),
    status: (
      <div className="space-y-1">
        <p className="font-bold">{formatStatus(examSession.status)}</p>
        <p className="text-xs text-muted-foreground">
          {examSession.closedAt ? `Afsluttet ${formatDate(examSession.closedAt)}` : "Åben"}
        </p>
      </div>
    ),
    numbers: (
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>{examSession.invitationCount} deltagere</p>
        <p>{examSession.completedAttemptCount} afleveret</p>
        <p>
          {examSession.passRate === null
            ? "Ingen beståelsesprocent"
            : `${Math.round(examSession.passRate)}% bestået`}
        </p>
      </div>
    ),
    actions: (
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          href={`/admin/sessions/${examSession.id}?view=instructor`}
          variant="secondary"
          size="sm"
        >
          Åbn
        </Button>
        <Button
          href={`/reports?examSessionId=${examSession.id}`}
          variant="secondary"
          size="sm"
        >
          Rapport
        </Button>
      </div>
    ),
  }));

  return (
    <div className="space-y-6 py-6 sm:py-8 lg:space-y-7 lg:py-8">
      <PageHeader
        eyebrow="Prøveafholdelser"
        title="Alle afholdelser"
        titleClassName="text-[clamp(2rem,4.4vw,3.2rem)] leading-[0.98] tracking-[-0.035em]"
        description="Se instruktørernes prøveafholdelser, åbn afholdelsesflowet for support, eller gå direkte til rapporten for en konkret afholdelse."
        descriptionClassName="max-w-3xl"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Aktive</p>
          <p className="font-display text-4xl">{activeCount}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Afsluttede</p>
          <p className="font-display text-4xl">{closedCount}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Deltagere</p>
          <p className="font-display text-4xl">{participantCount}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Afleveret</p>
          <p className="font-display text-4xl">{completedCount}</p>
        </Card>
      </section>

      <AdminTable
        caption="Alle prøveafholdelser"
        columns={columns}
        rows={rows}
        emptyMessage="Der er endnu ingen prøveafholdelser."
      />
    </div>
  );
}
