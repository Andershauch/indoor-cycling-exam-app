import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/ui/admin-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TextInput } from "@/components/ui/text-input";
import {
  createBatchInvitationsAction,
  createInvitationAction,
  logoutAdminAction,
} from "@/lib/admin/actions";
import { getAdminInvitationsSnapshot } from "@/lib/invitations/service";

export const dynamic = "force-dynamic";

type InvitationsPageProps = {
  searchParams: Promise<{
    batchOk?: string;
    batchError?: string;
    created?: string;
    failed?: string;
    ignored?: string;
    createOk?: string;
    createError?: string;
    recipient?: string;
  }>;
};

const columns = [
  { key: "recipient", label: "Deltager" },
  { key: "channel", label: "Kanal" },
  { key: "status", label: "Status" },
  { key: "tracking", label: "Sporing" },
  { key: "actions", label: "Link", align: "right" as const },
];

function formatDate(value: Date | null) {
  if (!value) {
    return "Ikke endnu";
  }

  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatStatus(status: string) {
  switch (status) {
    case "CREATED":
      return "Klar til afsendelse";
    case "SENT":
      return "Sendt";
    case "OPENED":
      return "Aabnet af deltager";
    case "COMPLETED":
      return "Proeve gennemfoert";
    case "EXPIRED":
      return "Udloebet";
    default:
      return status;
  }
}

export default async function InvitationsPage({ searchParams }: InvitationsPageProps) {
  const [params, snapshot] = await Promise.all([searchParams, getAdminInvitationsSnapshot()]);

  if (!snapshot) {
    return (
      <div className="slide-grid space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="Invitationer"
          title="INGEN AKTIV PROEVE"
          description="Invitationer kraever en aktiv proeve, saa linket kan pege direkte paa den rigtige eksamen."
        />
      </div>
    );
  }

  const statusCounts = snapshot.invitations.reduce<Record<string, number>>((result, invitation) => {
    result[invitation.status] = (result[invitation.status] ?? 0) + 1;
    return result;
  }, {});

  const rows = snapshot.invitations.map((invitation) => ({
    recipient: (
      <div className="space-y-1">
        <p className="font-bold">{invitation.recipientName || "Ukendt deltager"}</p>
        <p className="text-xs text-muted-foreground">
          {invitation.recipientEmail || invitation.recipientPhone || "Ingen kontaktoplysninger"}
        </p>
      </div>
    ),
    channel: invitation.channel === "EMAIL" ? "E-mail" : "SMS",
    status: (
      <div className="space-y-1">
        <p className="font-bold">{formatStatus(invitation.status)}</p>
        {invitation.lastDeliveryError ? (
          <p className="text-xs text-danger">{invitation.lastDeliveryError}</p>
        ) : null}
      </div>
    ),
    tracking: (
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Oprettet: {formatDate(invitation.createdAt)}</p>
        <p>Sendt: {formatDate(invitation.sentAt)}</p>
        <p>Aabnet: {formatDate(invitation.openedAt)}</p>
        <p>Faerdig: {formatDate(invitation.completedAt)}</p>
      </div>
    ),
    actions: (
      <Button href={invitation.invitationLink} variant="secondary" size="sm">
        Deltagerlink
      </Button>
    ),
  }));

  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Invitationer"
        title="UDSENDELSER OG BATCH-UPLOAD"
        description="Her kan du sende invitationer enkeltvis eller via Excel. Deltagerne faar deres personlige proevelink med det samme."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button href="/admin" variant="secondary" size="lg">
              Til overblik
            </Button>
            <form action={logoutAdminAction}>
              <Button type="submit" variant="secondary" size="lg">
                Log ud
              </Button>
            </form>
          </div>
        }
      />

      {params.createOk ? (
        <Card tone="strong" title="Invitation sendt" eyebrow="Klar til deltager">
          <p className="text-base leading-7 text-foreground">
            Invitationen er oprettet for {params.recipient ?? "deltageren"}.
          </p>
        </Card>
      ) : null}

      {params.createError ? (
        <Card title="Invitationen kunne ikke sendes" eyebrow="Fejl">
          <p className="text-base leading-7 text-danger">{params.createError}</p>
        </Card>
      ) : null}

      {params.batchOk ? (
        <Card tone="strong" title="Batch-upload gennemfoert" eyebrow="Importstatus">
          <p className="text-base leading-7 text-foreground">
            Oprettet: {params.created ?? "0"} · Fejlet: {params.failed ?? "0"} · Ignoreret:{" "}
            {params.ignored ?? "0"}
          </p>
        </Card>
      ) : null}

      {params.batchError ? (
        <Card title="Batch-upload kunne ikke gennemfoeres" eyebrow="Fejl">
          <p className="text-base leading-7 text-danger">{params.batchError}</p>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Klar</p>
          <p className="font-display text-4xl">{statusCounts.CREATED ?? 0}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Sendt</p>
          <p className="font-display text-4xl">{statusCounts.SENT ?? 0}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Aabnet</p>
          <p className="font-display text-4xl">{statusCounts.OPENED ?? 0}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Faerdige</p>
          <p className="font-display text-4xl">{statusCounts.COMPLETED ?? 0}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.08em]">Udloebne</p>
          <p className="font-display text-4xl">{statusCounts.EXPIRED ?? 0}</p>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="Ny enkeltinvitation" eyebrow="Manuel oprettelse">
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
              hint="Paakraevet ved e-mailinvitation."
            />
            <TextInput
              id="recipient-phone"
              name="recipientPhone"
              label="Telefon"
              placeholder="+45 12 34 56 78"
              hint="Paakraevet ved sms-invitation."
            />

            <fieldset className="grid gap-3">
              <legend className="text-sm font-bold uppercase tracking-[0.08em]">Kanal</legend>
              <label className="surface-card flex items-center gap-3 p-4">
                <input type="radio" name="channel" value="EMAIL" defaultChecked />
                <span className="font-bold">E-mail</span>
              </label>
              <label className="surface-card flex items-center gap-3 p-4">
                <input type="radio" name="channel" value="SMS" />
                <span className="font-bold">SMS</span>
              </label>
            </fieldset>

            <Button type="submit" size="lg">
              Opret invitation
            </Button>
          </form>
        </Card>

        <Card title="Batch-upload fra Excel" eyebrow="Gruppeopsaetning" className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            Upload en deltagerliste i Excel-format. Systemet laeser kun kolonnerne
            <strong> Fulde navn</strong> og <strong>E-mailadresse</strong> og ignorerer alt andet.
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
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              <li>Kun navn og e-mail bliver gemt og brugt til invitationerne.</li>
              <li>Tomme raekker, dubletter og raekker uden gyldig e-mail bliver ignoreret.</li>
              <li>Batch-upload sender invitationerne som e-mail med det samme.</li>
            </ul>
            <Button type="submit" size="lg">
              Opret batch-invitationer
            </Button>
          </form>
        </Card>
      </section>

      <AdminTable
        caption="Invitationer"
        columns={columns}
        rows={rows}
        emptyMessage="Der er endnu ingen invitationer."
      />
    </div>
  );
}
