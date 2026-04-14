import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { adminNavigation } from "@/lib/config/navigation";

type SiteHeaderProps = {
  compact?: boolean;
};

export function SiteHeader({ compact = false }: SiteHeaderProps) {
  const items = compact ? adminNavigation : [];

  return (
    <header className="border-b-2 border-border bg-background/90">
      <div className="slide-grid flex flex-col gap-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="hidden text-xs font-bold uppercase tracking-[0.18em] sm:inline">
              DGI Indoor Cycling
            </span>
          </Link>
          {compact ? null : (
            <Button href="/admin" variant="secondary" size="sm">
              Admin
            </Button>
          )}
        </div>
        {items.length > 0 ? (
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
        ) : null}
      </div>
    </header>
  );
}
