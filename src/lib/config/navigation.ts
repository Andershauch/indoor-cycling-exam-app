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
    label: "Afholdelse",
    items: [
      { href: "/admin", label: "Mine prøveafholdelser" },
      { href: "/admin/status", label: "Prøveafholdelser", roles: [AdminRole.SUPER_ADMIN] },
    ],
  },
  {
    label: "Rapportering",
    items: [{ href: "/reports", label: "Samlede rapporter", roles: [AdminRole.SUPER_ADMIN] }],
  },
  {
    label: "System",
    items: [
      { href: "/questions", label: "Prøveformater", roles: [AdminRole.SUPER_ADMIN] },
      { href: "/admins", label: "Instruktører", roles: [AdminRole.SUPER_ADMIN] },
    ],
  },
];
