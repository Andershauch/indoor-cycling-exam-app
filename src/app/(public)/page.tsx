import { AnswerChoice } from "@/components/ui/answer-choice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TextInput } from "@/components/ui/text-input";
import { TimerBadge } from "@/components/ui/timer-badge";

const highlights = [
  "Samme prøve og samme rækkefølge til alle deltagere",
  "Tydelig undervisningsstil med markante overskrifter",
  "Klar til auth, invitationer og rapportering i næste faser",
];

export default function LandingPage() {
  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Fast teoriprøve"
        title="INDOOR CYCLING EXAM APP"
        description="Et roligt og tydeligt prøvemiljø bygget i samme varme, undervisningsprægede stil som DGI-materialet."
        actions={
          <>
            <Button href="/exam" size="lg">
              Start prøve
            </Button>
            <Button href="/admin" variant="secondary" size="lg">
              Gå til admin
            </Button>
          </>
        }
      />

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-6">
          <div className="space-y-4">
            <p className="kicker">Adgang</p>
            <h2 className="section-title">START TRYGT OG TYDELIGT</h2>
            <p className="content-copy">
              Startskærmen skal føles som undervisningsmateriale, ikke som en
              anonym quiz. Deltageren møder et enkelt flow med høj kontrast,
              stærk retning og lav støj.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              id="navn"
              label="Navn"
              placeholder="Skriv dit navn"
              hint="Kan senere kobles til invitation eller deltagerprofil."
            />
            <TextInput
              id="kode"
              label="Adgangskode"
              placeholder="Indtast kode"
              hint="Kan senere erstattes af personligt prøvelink."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">Gå videre</Button>
            <Button variant="ghost" size="lg">
              Se prøveinfo
            </Button>
          </div>
        </Card>

        <Card tone="strong" className="space-y-5">
          <p className="kicker">Overblik</p>
          <ul className="space-y-3">
            {highlights.map((item) => (
              <li key={item} className="text-lg font-bold leading-snug">
                {item}
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <TimerBadge value="30:00" />
            <ProgressBar value={1} max={3} label="Prøvens faser" />
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card title="Eksempel på spørgsmål" eyebrow="Spørgsmålskort">
          <div className="space-y-4">
            <p className="text-xl font-bold leading-snug">
              Hvis du har smerter i knæet foran, er det typisk fordi?
            </p>
            <div className="space-y-3">
              <AnswerChoice
                id="landing-a"
                name="landing-answer"
                label="A"
                text="Styret er for lavt"
              />
              <AnswerChoice
                id="landing-b"
                name="landing-answer"
                label="B"
                text="Sadlen er for langt tilbage"
              />
              <AnswerChoice
                id="landing-c"
                name="landing-answer"
                label="C"
                text="Kørsel med for højt RPM eller tempo uden belastning"
                checked
                state="selected"
                readOnly
              />
            </div>
          </div>
        </Card>

        <Card title="Visuel retning" eyebrow="Designnote">
          <p className="content-copy text-foreground">
            Designet bruger store gule flader, sorte display-overskrifter og
            enkle hvide kontrastkort. Fokus er pædagogik, klarhed og høj
            læsbarhed på mobil først.
          </p>
        </Card>
      </section>
    </div>
  );
}
