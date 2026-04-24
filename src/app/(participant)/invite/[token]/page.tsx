import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { resolveInvitationLink } from "@/lib/invitations/service";

export const dynamic = "force-dynamic";

export default async function InvitationEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolution = await resolveInvitationLink(token);

  if (resolution.state === "invalid" || resolution.state === "expired") {
    return (
      <section className="participant-hero participant-surface mt-2">
        <div className="space-y-4">
          <p className="kicker">Invitation</p>
          <h1 className="participant-title">
            {resolution.state === "expired" ? "Linket er udløbet" : "Linket blev ikke fundet"}
          </h1>
          <p className="participant-lead">
            Kontakt underviseren, hvis du skal have et nyt prøvelink.
          </p>
        </div>
        <div className="participant-meta-card space-y-3">
          <p className="participant-meta-label">Næste skridt</p>
          <p className="text-base leading-7 text-muted-foreground">
            Invitationen kan være udløbet, slettet eller tastet forkert ind.
          </p>
        </div>
        <Button href="/" size="lg">
          Gå til forsiden
        </Button>
      </section>
    );
  }

  if (resolution.state === "redirect_result") {
    redirect(`/result/${resolution.attemptId}`);
  }

  if (resolution.state === "redirect_exam") {
    redirect(`/exam/${resolution.attemptId}`);
  }

  if (resolution.state !== "locked") {
    redirect("/");
  }

  const invitation = resolution.invitation;

  return (
    <section className="participant-hero participant-surface mt-2">
      <div className="space-y-4">
        <p className="kicker">Invitation til prøve</p>
        <h1 className="participant-title">Prøven er allerede åben</h1>
        <p className="participant-lead">
          {invitation.recipientName
            ? `${invitation.recipientName}, din prøve i ${invitation.examTitle} er allerede aktiv på en anden enhed.`
            : `Din prøve i ${invitation.examTitle} er allerede aktiv på en anden enhed.`}
        </p>
      </div>

      <div className="participant-meta-card space-y-3">
        <p className="participant-meta-label">Det skal du vide</p>
        <p className="text-base leading-7 text-muted-foreground">
          Af hensyn til eksamensintegritet tillades kun én aktiv deltager-session ad gangen.
          Fortsæt på den enhed, hvor linket først blev åbnet, eller vent til sessionen udløber.
        </p>
      </div>

      <Button href="/" size="lg">
        Gå til forsiden
      </Button>
    </section>
  );
}
