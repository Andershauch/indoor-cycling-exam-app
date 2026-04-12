import { AdminTable } from "@/components/ui/admin-table";
import { AnswerChoice } from "@/components/ui/answer-choice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TextInput } from "@/components/ui/text-input";
import { TimerBadge } from "@/components/ui/timer-badge";
import { designTokens } from "@/lib/design/theme";

const tokenRows = Object.entries(designTokens.colors).map(([name, value]) => ({
  name: <span className="font-bold uppercase">{name}</span>,
  value: (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="h-8 w-8 rounded-full border-2 border-border"
        style={{ backgroundColor: value }}
      />
      <span>{value}</span>
    </div>
  ),
}));

const adminColumns = [
  { key: "name", label: "Token" },
  { key: "value", label: "Værdi" },
];

export default function DesignSystemPage() {
  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Style guide"
        title="DESIGNSYSTEM"
        description="Samlet overblik over tokens, typografi, knapper, formularer og eksamenskomponenter i samme DGI-inspirerede identitet."
      />

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card title="Farver" eyebrow="Tokens">
          <AdminTable caption="Farvetokens" columns={adminColumns} rows={tokenRows} />
        </Card>
        <Card title="Typografi" eyebrow="Tokens" className="space-y-4">
          <p className="display-title">KOMMUNIKATION</p>
          <p className="section-title">Instruktørfokus</p>
          <p className="text-lg font-bold">
            Tydelig, kompakt og let at aflæse på mobil.
          </p>
          <p className="content-copy">
            Brødtekst holdes enkel i Arial-lignende sans serif, mens store
            overskrifter bruger tung display-typografi med undervisningspræg.
          </p>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card title="Knapper og timer" eyebrow="Komponenter" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button>Primær</Button>
            <Button variant="secondary">Sekundær</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="contrast">Kontrast</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <TimerBadge value="29:12" />
            <TimerBadge value="08:10" tone="warning" />
            <TimerBadge value="01:34" tone="danger" />
          </div>
          <ProgressBar value={42} label="Eksempelprogression" />
        </Card>

        <Card title="Inputfelter" eyebrow="Komponenter" className="grid gap-4">
          <TextInput
            id="guide-name"
            label="Navn"
            placeholder="Skriv dit navn"
            hint="Bruges på adgangs- eller invitationstrin."
          />
          <TextInput
            id="guide-email"
            label="E-mail"
            placeholder="navn@example.com"
            error="Eksempel på fejlbesked"
          />
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Svarmuligheder" eyebrow="Komponenter" className="space-y-3">
          <AnswerChoice
            id="guide-answer-a"
            name="guide-answer"
            label="A"
            text="Standard state"
          />
          <AnswerChoice
            id="guide-answer-b"
            name="guide-answer"
            label="B"
            text="Valgt svar"
            checked
            readOnly
            state="selected"
          />
          <AnswerChoice
            id="guide-answer-c"
            name="guide-answer"
            label="C"
            text="Korrekt svar i resultatvisning"
            checked
            readOnly
            state="correct"
          />
          <AnswerChoice
            id="guide-answer-d"
            name="guide-answer"
            label="D"
            text="Forkert svar i resultatvisning"
            checked
            readOnly
            state="incorrect"
          />
        </Card>

        <Card title="Admin table" eyebrow="Komponenter">
          <AdminTable
            caption="Eksempel på admin table"
            columns={[
              { key: "title", label: "Titel" },
              { key: "state", label: "State", align: "right" },
            ]}
            rows={[
              { title: "Fast prøve", state: "Aktiv" },
              { title: "Invitation", state: "Sendt" },
            ]}
          />
        </Card>
      </section>
    </div>
  );
}
