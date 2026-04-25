import { AdminRole } from "@prisma/client";

export type NavigationItem = {
  href: string;
  label: string;
};

export type AdminNavigationSection = {
  label: string;
  items: Array<{
    href: string;
    label: string;
    roles?: AdminRole[];
  }>;
};

export const primaryNavigation: NavigationItem[] = [
  { href: "/", label: "Forside" },
  { href: "/exam", label: "Prøve" },
  { href: "/result", label: "Resultat" },
  { href: "/design-system", label: "Design" },
];

export const adminNavigationSections: AdminNavigationSection[] = [
  {
    label: "Før prøven",
    items: [
      { href: "/admin", label: "Afhold prøve" },
      { href: "/invitations", label: "Invitationer", roles: [AdminRole.SUPER_ADMIN] },
    ],
  },
  {
    label: "Under prøven",
    items: [{ href: "/admin/status", label: "Status", roles: [AdminRole.SUPER_ADMIN] }],
  },
  {
    label: "Efter prøven",
    items: [{ href: "/reports", label: "Rapporter", roles: [AdminRole.SUPER_ADMIN] }],
  },
  {
    label: "System",
    items: [
      { href: "/questions", label: "Spørgsmål", roles: [AdminRole.SUPER_ADMIN] },
      { href: "/admins", label: "Admins", roles: [AdminRole.SUPER_ADMIN] },
    ],
  },
];
