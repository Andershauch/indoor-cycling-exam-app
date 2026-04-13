import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getInvitationEntryState, startInvitationAttempt } from "@/lib/invitations/service";

export const dynamic = "force-dynamic";

export default async function InvitationEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolution = await getInvitationEntryState(token);

  async function handleStart() {
    "use server";

    const nextStep = await startInvitationAttempt(token);

    if (nextStep.state === "exam") {
      redirect(`/exam/${nextStep.attemptId}`);
    }

    if (nextStep.state === "result") {
      redirect(`/result/${nextStep.attemptId}`);
    }

    redirect(`/invite/${token}`);
  }

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

  if (resolution.state === "result") {
    redirect(`/result/${resolution.attemptId}`);
  }

  if (resolution.state !== "start" && resolution.state !== "resume") {
    redirect("/");
  }

  const invitation = resolution.invitation;

  return (
    <section className="participant-hero participant-surface mt-2">
      <div className="space-y-4">
        <p className="kicker">Invitation til prøve</p>
        <h1 className="participant-title">
          {resolution.state === "resume" ? "Fortsæt prøven" : "Klar til prøven?"}
        </h1>
        <p className="participant-lead">
          {invitation.recipientName
            ? `${invitation.recipientName}, du er inviteret til ${invitation.examTitle}.`
            : `Du er inviteret til ${invitation.examTitle}.`}
        </p>
      </div>

      <div className="participant-meta-grid">
        <div className="participant-meta-card">
          <p className="participant-meta-label">Varighed</p>
          <p className="participant-meta-value">{invitation.timeLimitMinutes} min</p>
        </div>
        <div className="participant-meta-card">
          <p className="participant-meta-label">Spørgsmål</p>
          <p className="participant-meta-value">{invitation.totalQuestionCount}</p>
        </div>
      </div>

      <div className="participant-meta-card space-y-3">
        <p className="participant-meta-label">Det skal du vide</p>
        <ul className="space-y-2 text-base leading-7 text-muted-foreground">
          <li>Dine svar gemmes automatisk undervejs.</li>
          <li>Du kan gå tilbage og ændre svar helt frem til aflevering.</li>
          <li>Resultatet vises med det samme, når prøven er afleveret.</li>
        </ul>
      </div>

      <form action={handleStart} className="grid gap-3">
        <Button type="submit" size="lg">
          {resolution.state === "resume" ? "Fortsæt prøve" : "Start prøve"}
        </Button>
        <p className="text-center text-sm leading-6 text-muted-foreground">
          Åbn prøven på din telefon for den bedste oplevelse.
        </p>
      </form>
    </section>
  );
}
