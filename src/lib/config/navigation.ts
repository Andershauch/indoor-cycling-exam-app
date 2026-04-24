type NavigationItem = {
  href: string;
  label: string;
};

export const primaryNavigation: NavigationItem[] = [
  { href: "/", label: "Forside" },
  { href: "/exam", label: "Prøve" },
  { href: "/result", label: "Resultat" },
  { href: "/design-system", label: "Design" },
];

export const adminNavigation: NavigationItem[] = [
  { href: "/admin", label: "Overblik" },
  { href: "/admin/status", label: "Status" },
  { href: "/admins", label: "Admins" },
  { href: "/questions", label: "Spørgsmål" },
  { href: "/invitations", label: "Invitationer" },
  { href: "/reports", label: "Rapporter" },
];
