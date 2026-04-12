import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
      <div className="slide-grid space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="Prøve"
          title="INGEN AKTIV PRØVE"
          description="Der er endnu ikke importeret en aktiv prøve. Importér først spørgsmål i admin."
        />
      </div>
    );
  }

  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Start prøve"
        title={examSet.title.toUpperCase()}
        description="Når du starter, får du 30 minutter. Du kan gå frem og tilbage mellem spørgsmål og ændre svar helt frem til aflevering."
      />

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card title="Klar til start" eyebrow="Deltager">
          <form action={startExam} className="grid gap-4">
            <TextInput
              id="participantName"
              name="participantName"
              label="Navn"
              placeholder="Skriv dit navn"
              hint="Valgfrit i denne fase, men klar til senere invitationer."
            />
            <TextInput
              id="participantEmail"
              name="participantEmail"
              type="email"
              label="E-mail"
              placeholder="navn@example.com"
              hint="Valgfrit i denne fase."
            />
            <Button type="submit" size="lg">
              Start prøve
            </Button>
          </form>
        </Card>

        <Card tone="strong" title="Prøveinfo" eyebrow="Fast setup">
          <ul className="space-y-3 text-base leading-7">
            <li>Samme spørgsmål og samme rækkefølge for alle deltagere.</li>
            <li>{examSet.timeLimitMinutes} minutters tidsgrænse.</li>
            <li>Svar gemmes løbende undervejs.</li>
            <li>Du kan aflevere manuelt eller automatisk ved tidsudløb.</li>
            <li>Resultatet vises straks efter aflevering.</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
