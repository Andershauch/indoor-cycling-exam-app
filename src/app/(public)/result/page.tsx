import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function ResultFallbackPage() {
  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:py-10">
      <PageHeader
        eyebrow="Resultat"
        title="INGEN AKTIV RESULTATSIDE"
        description="Resultatet vises på en individuel adresse efter aflevering af prøven."
      />
      <Card title="Næste skridt" eyebrow="Prøveflow">
        <div className="space-y-4">
          <p className="text-base leading-7 text-muted-foreground">
            Start en prøve først, så bliver du sendt direkte til din personlige
            resultatside ved aflevering.
          </p>
          <Button href="/exam" size="lg">
            Gå til prøvestart
          </Button>
        </div>
      </Card>
    </div>
  );
}
