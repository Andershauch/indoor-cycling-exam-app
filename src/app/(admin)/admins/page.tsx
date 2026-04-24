import { AdminRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/ui/admin-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TextInput } from "@/components/ui/text-input";
import {
  createAdminUserAction,
  toggleAdminUserActiveAction,
  updateAdminUserRoleAction,
} from "@/lib/admin/actions";
import { requireAdminSession } from "@/lib/admin/auth";
import { getAdminUsersSnapshot } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

const columns = [
  { key: "identity", label: "Admin" },
  { key: "role", label: "Rolle" },
  { key: "status", label: "Status" },
  { key: "activity", label: "Aktivitet" },
  { key: "actions", label: "Handling", align: "right" as const },
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

export default async function AdminUsersPage() {
  await requireAdminSession(AdminRole.SUPER_ADMIN);
  const snapshot = await getAdminUsersSnapshot();

  const rows = snapshot.users.map((user) => ({
    identity: (
      <div className="space-y-1">
        <p className="font-bold">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>
    ),
    role: (
      <form action={updateAdminUserRoleAction} className="flex items-center gap-2">
        <input type="hidden" name="adminUserId" value={user.id} />
        <select
          name="role"
          defaultValue={user.role}
          disabled={user.isBootstrapSuperAdmin}
          className="min-h-10 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none"
        >
          {snapshot.roleOptions.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm" disabled={user.isBootstrapSuperAdmin}>
          Gem
        </Button>
      </form>
    ),
    status: (
      <div className="space-y-1">
        <p className="font-bold">{user.isActive ? "Aktiv" : "Deaktiveret"}</p>
        <p className="text-xs text-muted-foreground">
          {user.isBootstrapSuperAdmin ? "Bootstrap-superadmin" : "Database-styret adgang"}
        </p>
      </div>
    ),
    activity: (
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Magic link: {formatDate(user.lastMagicLinkSentAt)}</p>
        <p>Invitationer: {user._count.createdInvites}</p>
        <p>Prøver: {user._count.createdExams}</p>
      </div>
    ),
    actions: (
      <form action={toggleAdminUserActiveAction}>
        <input type="hidden" name="adminUserId" value={user.id} />
        <input type="hidden" name="nextActive" value={user.isActive ? "false" : "true"} />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={user.isBootstrapSuperAdmin}
        >
          {user.isActive ? "Deaktivér" : "Aktivér"}
        </Button>
      </form>
    ),
  }));

  return (
    <div className="space-y-6 py-6 sm:py-8 lg:space-y-7 lg:py-8">
      <PageHeader
        eyebrow="System"
        title="Admin-brugere"
        titleClassName="text-[clamp(2.1rem,4.8vw,3.25rem)] leading-[0.96] tracking-[-0.04em]"
        description="Her styrer du, hvem der har adgang til admin, og hvilken rolle de har."
        descriptionClassName="max-w-3xl"
      />

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card
          title="Opret admin"
          eyebrow="Ny adgang"
          titleClassName="text-[clamp(1.9rem,3.8vw,2.7rem)] leading-[0.97] tracking-[-0.03em]"
        >
          <form action={createAdminUserAction} className="grid gap-4">
            <TextInput
              id="admin-name"
              name="name"
              label="Navn"
              placeholder="Underviserens navn"
            />
            <TextInput
              id="admin-email"
              name="email"
              label="E-mail"
              type="email"
              placeholder="underviser@example.com"
              required
            />
            <label className="grid gap-2">
              <span className="text-sm font-bold uppercase tracking-[0.08em]">Rolle</span>
              <select
                name="role"
                defaultValue="EDITOR"
                className="min-h-12 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 text-base text-foreground focus-visible:outline-none"
              >
                {snapshot.roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="lg">
              Opret admin
            </Button>
          </form>
        </Card>

        <Card
          title="Rollepolitik"
          eyebrow="Adgangsniveauer"
          titleClassName="text-[clamp(1.9rem,3.8vw,2.7rem)] leading-[0.97] tracking-[-0.03em]"
          className="space-y-4"
        >
          <p className="text-sm leading-7 text-muted-foreground">
            Superadmin kan ændre spørgsmål, roller og alle systemopsætninger. Almindelig admin kan
            bruge magic link-login, uploade Excel-filer, sende invitationer og se rapporter.
          </p>
          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
            <li>Bootstrap-superadmin er bundet til miljøvariablen og kan ikke slås fra i UI.</li>
            <li>Andre admins styres direkte i databasen og kan aktiveres eller deaktiveres.</li>
            <li>Magic links sendes kun til aktive admins.</li>
          </ul>
        </Card>
      </section>

      <AdminTable
        caption="Admin-brugere"
        columns={columns}
        rows={rows}
        emptyMessage="Der er endnu ingen admin-brugere."
      />
    </div>
  );
}
