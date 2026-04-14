import { Card } from "@/components/ui/card";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const userAgent = (await headers()).get("user-agent") ?? "";
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(userAgent);

  if (!isMobile) {
    redirect("/admin");
  }

  return (
    <div className="slide-grid py-6 sm:py-8">
      <Card tone="strong" className="space-y-5 md:hidden">
        <div className="space-y-3">
          <p className="kicker">Deltageradgang</p>
          <h1 className="section-title">ÅBN DIT PRØVELINK FRA MAILEN</h1>
          <p className="text-base leading-7 text-foreground">
            På mobil bruges appen kun til selve prøven. Åbn det personlige link, du
            har modtaget på mail, for at starte eller fortsætte.
          </p>
        </div>
        <div className="rounded-[1rem] border-2 border-border bg-surface px-4 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Vigtigt</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Hvis du er underviser eller admin, skal du åbne siden på en computer og
            bruge adminområdet derfra.
          </p>
        </div>
      </Card>
    </div>
  );
}
