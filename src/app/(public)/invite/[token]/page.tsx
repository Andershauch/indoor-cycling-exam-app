import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { resolveInvitationStart } from "@/lib/invitations/service";

export const dynamic = "force-dynamic";

export default async function InvitationEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolution = await resolveInvitationStart(token);

  if (resolution.state === "exam") {
    redirect(`/exam/${resolution.attemptId}`);
  }

  if (resolution.state === "result") {
    redirect(`/result/${resolution.attemptId}`);
  }

  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:py-10">
      <PageHeader
        eyebrow="Invitation"
        title={
          resolution.state === "expired"
            ? "INVITATIONEN ER UDLØBET"
            : "INVITATIONEN BLEV IKKE FUNDET"
        }
        description="Kontakt underviseren, hvis du skal have et nyt prøvelink."
      />

      <Card title="Næste skridt" eyebrow="Hjælp">
        <div className="space-y-4">
          <p className="text-base leading-7 text-muted-foreground">
            Linket kan være udløbet eller ugyldigt. Admin kan oprette en ny invitation fra
            invitationsområdet.
          </p>
          <Button href="/" size="lg">
            Gå til forsiden
          </Button>
        </div>
      </Card>
    </div>
  );
}
