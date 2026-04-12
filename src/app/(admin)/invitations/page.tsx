import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/ui/admin-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TextInput } from "@/components/ui/text-input";
import { createInvitationAction, logoutAdminAction } from "@/lib/admin/actions";
import { getAdminInvitationsSnapshot } from "@/lib/invitations/service";

export const dynamic = "force-dynamic";

const columns = [
  { key: "recipient", label: "Deltager" },
  { key: "channel", label: "Kanal" },
  { key: "status", label: "Status" },
  { key: "tracking", label: "Sporing" },
  { key: "actions", label: "Link", align: "right" as const },
];

function formatDate(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("da-DK", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatStatus(status: string) {
  switch (status) {
    case "CREATED":
      return "Created";
    case "SENT":
      return "Sent";
    case "OPENED":
      return "Opened";
    case "COMPLETED":
      return "Completed";
    case "EXPIRED":
      return "Expired";
    default:
      return status;
  }
}

export default async function InvitationsPage() {
  const snapshot = await getAdminInvitationsSnapshot();

  if (!snapshot) {
    return (
      <div className="slide-grid space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="Invitationer"
          title="INGEN AKTIV PRØVE"
          description="Invitationer kræver en aktiv prøve, så linket kan pege direkte på den rigtige eksamen."
        />
      </div>
    );
  }

  const rows = snapshot.invitations.map((invitation) => ({
    recipient: (
      <div className="space-y-1">
        <p className="font-bold">{invitation.recipientName || "Ukendt deltager"}</p>
        <p className="text-xs text-muted-foreground">
          {invitation.recipientEmail || invitation.recipientPhone || "Ingen kontaktinfo"}
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
        <p>Åbnet: {formatDate(invitation.openedAt)}</p>
        <p>Completed: {formatDate(invitation.completedAt)}</p>
      </div>
    ),
    actions: (
      <div className="flex flex-wrap justify-end gap-2">
        <Button href={invitation.invitationLink} variant="secondary" size="sm">
          Åbn link
        </Button>
        {invitation.latestAttemptId ? (
          <Button href={`/result/${invitation.latestAttemptId}`} size="sm">
            Resultat
          </Button>
        ) : null}
      </div>
    ),
  }));

  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Invitationer"
        title="SEND PRØVELINK"
        description="Invitationer oprettes med sikkert token og kan spores fra created til completed."
        actions={
          <form action={logoutAdminAction}>
            <Button type="submit" variant="secondary" size="lg">
              Log ud
            </Button>
          </form>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="Ny invitation" eyebrow="Udsendelse">
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
              hint="Påkrævet ved e-mailinvitation."
            />
            <TextInput
              id="recipient-phone"
              name="recipientPhone"
              label="Telefon"
              placeholder="+45 12 34 56 78"
              hint="Påkrævet ved sms-invitation."
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

            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="lg">
                Opret invitation
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Providerstruktur" eyebrow="Klargjort" className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            Udsendelse går gennem små service-abstraktioner for mail og sms, så rigtig
            providerintegration kan sættes på uden at ændre admin-UI eller invitationmodellen.
          </p>
          <ul className="space-y-2 text-sm leading-6">
            <li>`MAIL_PROVIDER_API_KEY` og `RESEND_FROM_EMAIL` styrer mail.</li>
            <li>`SMS_PROVIDER_API_KEY` styrer sms.</li>
            <li>Hvis credentials mangler, bliver invitationen stadig oprettet og sporbar.</li>
            <li>Linket peger direkte på `/invite/[token]` og starter eller genoptager prøven.</li>
          </ul>
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
