import type { Route } from "next";

type NavigationItem = {
  href: Route;
  label: string;
};

export const primaryNavigation: NavigationItem[] = [
  { href: "/", label: "Forside" },
  { href: "/exam", label: "Prøve" },
  { href: "/result", label: "Resultat" },
  { href: "/design-system", label: "Design" },
];

export const adminNavigation: NavigationItem[] = [
  { href: "/admin", label: "Admin" },
  { href: "/invitations", label: "Invitationer" },
  { href: "/reports", label: "Rapporter" },
];
