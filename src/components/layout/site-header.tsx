import Link from "next/link";

import { Button } from "@/components/ui/button";
import { adminNavigation, primaryNavigation } from "@/lib/config/navigation";

type SiteHeaderProps = {
  compact?: boolean;
};

export function SiteHeader({ compact = false }: SiteHeaderProps) {
  const items = compact ? adminNavigation : primaryNavigation;

  return (
    <header className="border-b-2 border-border bg-background/90">
      <div className="slide-grid flex flex-col gap-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="logo-slot">Logo</span>
            <span className="hidden text-xs font-bold uppercase tracking-[0.18em] sm:inline">
              DGI-plads
            </span>
          </Link>
          <Button href="/design-system" variant="secondary" size="sm">
            Style guide
          </Button>
        </div>
        <nav className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Button
              key={item.href}
              href={item.href}
              variant="ghost"
              size="sm"
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
