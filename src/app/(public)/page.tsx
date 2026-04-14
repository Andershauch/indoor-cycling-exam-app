import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const adminSteps = [
  "Upload Excel med deltagere",
  "Send prøvelinks ud på mail",
  "Følg status undervejs",
  "Se resultater når prøverne er færdige",
];

export default function LandingPage() {
  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <section className="hidden md:block">
        <PageHeader
          eyebrow="Admin"
          title="ADMIN TIL UDDANNELSESFORLØBET"
          description="Webversionen er adminværktøjet. Her uploader du deltagerlisten, sender prøvelinks og følger resultaterne undervejs i forløbet."
          actions={
            <>
              <Button href="/admin" size="lg">
                Åbn admin
              </Button>
              <Button href="/questions" variant="secondary" size="lg">
                Spørgsmål
              </Button>
            </>
          }
        />
      </section>

      <section className="hidden gap-5 md:grid lg:grid-cols-[1.05fr_0.95fr]">
        <Card title="Sådan bruges systemet" eyebrow="Workflow">
          <ol className="grid gap-4 text-lg font-bold leading-snug">
            {adminSteps.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border-2 border-border bg-surface-strong text-sm">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Desktop først" eyebrow="Adminadgang" tone="strong">
          <div className="space-y-4">
            <p className="text-base leading-7 text-foreground">
              Admin er lavet til web og desktop. Deltagerne skal ikke bruge forsiden,
              men åbner deres personlige prøvelink direkte fra mailen på mobilen.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button href="/admin" size="lg">
                Gå til admin
              </Button>
              <Button href="/reports" variant="secondary" size="lg">
                Se rapporter
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section className="md:hidden">
        <Card tone="strong" className="space-y-5">
          <div className="space-y-3">
            <p className="kicker">Deltageradgang</p>
            <h1 className="section-title">ÅBN DIT PRØVELINK FRA MAILEN</h1>
            <p className="text-base leading-7 text-foreground">
              På mobil bruges appen kun til selve prøven. Åbn det personlige link,
              du har modtaget på mail, for at starte eller fortsætte.
            </p>
          </div>
          <div className="rounded-[1rem] border-2 border-border bg-surface px-4 py-4">
            <p className="text-sm font-bold uppercase tracking-[0.08em]">Vigtigt</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Hvis du er underviser eller admin, skal du åbne siden på en computer
              og bruge adminområdet derfra.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
