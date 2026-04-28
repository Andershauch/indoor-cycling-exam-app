import { AdminRole } from "@prisma/client";
import { notFound } from "next/navigation";

import { InstructorExamFlow } from "@/components/admin/instructor-exam-flow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  getAdminDashboardSnapshot,
  getAdminReportsSnapshot,
  getExamSessionAdminSnapshot,
} from "@/lib/admin/data";
import { getAdminInvitationsSnapshot } from "@/lib/invitations/service";

export const dynamic = "force-dynamic";

type AdminSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
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
  }>;
};

export default async function AdminSessionPage({
  params,
  searchParams,
}: AdminSessionPageProps) {
  const adminSession = await requireAdminSession();
  const [{ sessionId }, queryParams] = await Promise.all([params, searchParams]);

  const sessionSnapshot = await getExamSessionAdminSnapshot({
    adminUserId: adminSession.id,
    includeAll: adminSession.role === AdminRole.SUPER_ADMIN,
  });
  const selectedExamSession =
    sessionSnapshot.sessions.find((examSession) => examSession.id === sessionId) ?? null;

  if (!selectedExamSession) {
    notFound();
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
            {adminSession.role === AdminRole.SUPER_ADMIN ? "Testvisning" : "Instruktørflow"}
          </p>
          <h1 className="font-display text-[clamp(2.35rem,4.4vw,3.4rem)] leading-[0.96] uppercase tracking-[-0.04em]">
            Ingen aktiv prøve
          </h1>
          <p className="content-copy text-base">
            Prøveafholdelsen kunne ikke kobles til et aktivt prøveformat. Tjek opsætningen i
            SuperAdmin, og åbn derefter afholdelsen igen.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mx-auto flex w-full max-w-[58rem] justify-end">
        <Button
          href={adminSession.role === AdminRole.SUPER_ADMIN ? "/superadmin" : "/admin"}
          variant="secondary"
          size="sm"
        >
          {adminSession.role === AdminRole.SUPER_ADMIN
            ? "Tilbage til superadmin"
            : "Tilbage til afholdelser"}
        </Button>
      </div>
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
        basePath={`/admin/sessions/${selectedExamSession.id}`}
        params={queryParams}
      />
    </div>
  );
}
