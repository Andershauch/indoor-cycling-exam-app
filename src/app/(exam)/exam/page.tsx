import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";
import { createAttempt, getActiveExamSet } from "@/lib/exam/service";

export const dynamic = "force-dynamic";

export default async function ExamStartPage() {
  const examSet = await getActiveExamSet();

  async function startExam(formData: FormData) {
    "use server";

    const participantName = String(formData.get("participantName") ?? "");
    const participantEmail = String(formData.get("participantEmail") ?? "");
    const attempt = await createAttempt({
      participantName,
      participantEmail,
    });

    redirect(`/exam/${attempt.id}`);
  }

  if (!examSet) {
    return (
      <section className="participant-hero participant-surface mt-2">
        <div className="space-y-4">
          <p className="kicker">Prøve</p>
          <h1 className="participant-title">Ingen aktiv prøve</h1>
          <p className="participant-lead">
            Der er endnu ikke importeret en aktiv prøve. Importér først spørgsmål i admin.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4 pb-8 pt-2">
      <section className="participant-hero participant-surface">
        <div className="space-y-4">
          <p className="kicker">Start prøve</p>
          <h1 className="participant-title">{examSet.title}</h1>
          <p className="participant-lead">
            Når du starter, begynder tiden. Du kan gå frem og tilbage mellem spørgsmål og
            ændre svar helt frem til aflevering.
          </p>
        </div>

        <div className="participant-meta-grid">
          <div className="participant-meta-card">
            <p className="participant-meta-label">Varighed</p>
            <p className="participant-meta-value">{examSet.timeLimitMinutes} min</p>
          </div>
          <div className="participant-meta-card">
            <p className="participant-meta-label">Opsætning</p>
            <p className="participant-meta-value">Fast prøve</p>
          </div>
        </div>

        <div className="participant-meta-card space-y-3">
          <p className="participant-meta-label">Før du starter</p>
          <ul className="space-y-2 text-base leading-7 text-muted-foreground">
            <li>Dine svar gemmes automatisk undervejs.</li>
            <li>Du kan gå tilbage og ændre svar, indtil du afleverer.</li>
            <li>Resultatet vises med det samme, når prøven er slut.</li>
          </ul>
        </div>
      </section>

      <section className="participant-surface grid gap-5 p-6">
        <div className="space-y-2">
          <p className="kicker">Klar til at begynde?</p>
          <h2 className="section-title">Prøven starter nu</h2>
          <p className="participant-lead">
            Navn og e-mail er valgfrie her, men gør det lettere at kende dit forsøg senere.
          </p>
        </div>

        <form action={startExam} className="grid gap-4">
          <TextInput
            id="participantName"
            name="participantName"
            label="Navn"
            placeholder="Skriv dit navn"
          />
          <TextInput
            id="participantEmail"
            name="participantEmail"
            type="email"
            label="E-mail"
            placeholder="navn@example.com"
          />
          <Button type="submit" size="lg">
            Start nu
          </Button>
        </form>
      </section>
    </div>
  );
}
