import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TextInput } from "@/components/ui/text-input";
import {
  createBatchInvitationsAction,
  createInvitationAction,
  logoutAdminAction,
} from "@/lib/admin/actions";
import { getAdminDashboardSnapshot } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    batchOk?: string;
    batchError?: string;
    created?: string;
    failed?: string;
    ignored?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [params, dashboard] = await Promise.all([searchParams, getAdminDashboardSnapshot()]);

  if (!dashboard) {
    return (
      <div className="slide-grid space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="Upload"
          title="INGEN AKTIV PRØVE"
          description="Importér eller opret først en aktiv prøve, før deltagere kan uploades her."
        />
      </div>
    );
  }

  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Trin 1"
        title="UPLOAD DELTAGERLISTE"
        description="Upload Excel-filen og send prøvelinks ud. Når uploaden er gennemført, fortsætter du til statussiden."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button href="/questions" variant="secondary" size="lg">
              Spørgsmål
            </Button>
            <Button href="/reports" variant="secondary" size="lg">
              Se rapporter
            </Button>
          </div>
        }
      />

      {params.batchOk ? (
        <Card tone="strong" title="Batch-upload gennemført" eyebrow="Importstatus">
          <p className="text-base leading-7 text-foreground">
            Oprettet: {params.created ?? "0"} · Fejlet: {params.failed ?? "0"} · Ignoreret:{" "}
            {params.ignored ?? "0"}
          </p>
          <div className="pt-2">
            <Button href="/admin/status" size="lg">
              Gå til status
            </Button>
          </div>
        </Card>
      ) : null}

      {params.batchError ? (
        <Card title="Batch-upload kunne ikke gennemføres" eyebrow="Fejl">
          <p className="text-base leading-7 text-danger">{params.batchError}</p>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Aktiv prøve</p>
          <p className="font-display text-4xl">1</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Beståelseskrav</p>
          <p className="font-display text-4xl">{dashboard.exam.passPercentage}%</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Tidsramme</p>
          <p className="font-display text-4xl">30 min</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Kanal</p>
          <p className="font-display text-4xl">Mail</p>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Upload deltagerliste" eyebrow="Batch fra Excel" className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            Upload Excel-filen med deltagerne. Systemet læser kun kolonnerne
            <strong> Fulde navn</strong> og <strong>E-mailadresse</strong> og ignorerer resten.
          </p>
          <form action={createBatchInvitationsAction} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold uppercase tracking-[0.08em]">Excel-fil</span>
              <input
                type="file"
                name="batchFile"
                accept=".xlsx,.xls"
                className="min-h-12 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 py-3 text-base text-foreground focus-visible:outline-none"
              />
            </label>
            <Button type="submit" size="lg">
              Upload og send links
            </Button>
          </form>
        </Card>

        <Card title="Tilføj én deltager" eyebrow="Manuel fallback" className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            Brug kun denne, hvis en enkelt deltager mangler efter batch-upload.
          </p>
          <form action={createInvitationAction} className="grid gap-4">
            <TextInput
              id="recipient-name"
              name="recipientName"
              label="Navn"
              placeholder="Deltagerens navn"
            />
            <TextInput
              id="recipient-email"
              name="recipientEmail"
              label="E-mail"
              type="email"
              placeholder="navn@example.com"
            />
            <input type="hidden" name="channel" value="EMAIL" />
            <Button type="submit" size="lg">
              Send til deltager
            </Button>
          </form>
        </Card>
      </section>

      <div className="flex justify-between gap-3">
        <Button href="/admin/status" variant="secondary" size="lg">
          Åbn status
        </Button>
        <form action={logoutAdminAction}>
          <Button type="submit" variant="secondary" size="sm">
            Log ud
          </Button>
        </form>
      </div>
    </div>
  );
}
