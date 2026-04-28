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
    label: "System",
    items: [{ href: "/superadmin", label: "Overblik", roles: [AdminRole.SUPER_ADMIN] }],
  },
  {
    label: "Afholdelser",
    items: [
      { href: "/admin", label: "Mine prøveafholdelser", roles: [AdminRole.EDITOR] },
      { href: "/admin/status", label: "Prøveafholdelser", roles: [AdminRole.SUPER_ADMIN] },
    ],
  },
  {
    label: "Rapportering",
    items: [{ href: "/reports", label: "Samlede rapporter", roles: [AdminRole.SUPER_ADMIN] }],
  },
  {
    label: "Opsætning",
    items: [
      { href: "/questions", label: "Prøveformater", roles: [AdminRole.SUPER_ADMIN] },
      { href: "/admins", label: "Instruktører", roles: [AdminRole.SUPER_ADMIN] },
    ],
  },
];
