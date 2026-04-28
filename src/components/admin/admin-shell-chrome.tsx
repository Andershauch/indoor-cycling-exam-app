"use client";

import Link from "next/link";
import { AdminRole } from "@prisma/client";
import { usePathname } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useState } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { adminNavigationSections } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";

type AdminShellChromeProps = {
  role: AdminRole;
  name: string;
  email: string;
  children: ReactNode;
  footer?: ReactNode;
};

function matchesPathname(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/sessions/");
  }

  if (href === "/superadmin") {
    return pathname === "/superadmin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShellChrome({
  role,
  name,
  email,
  children,
  footer,
}: AdminShellChromeProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isSuperAdmin = role === AdminRole.SUPER_ADMIN;
  const homeHref = isSuperAdmin ? "/superadmin" : "/admin";

  const sections = adminNavigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  const activeItem = sections
    .flatMap((section) => section.items)
    .find((item) => matchesPathname(pathname, item.href));

  const navContent = (
    <div className="flex h-full flex-col gap-5">
      <div className="rounded-[1.25rem] border border-border-soft bg-white/55 p-3.5 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <BrandLogo size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {isSuperAdmin ? "Admin" : "Instruktør"}
            </p>
            <p className="truncate text-sm font-bold text-foreground">{name}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <div className="mt-3 inline-flex rounded-full border border-border-soft bg-surface px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {isSuperAdmin ? "Superadmin" : "Instruktør"}
        </div>
      </div>

      <nav className="space-y-5" aria-label="Admin navigation">
        {sections.map((section) => (
          <div key={section.label} className="space-y-2">
            <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {section.label}
            </p>
            <div className="grid gap-1">
              {section.items.map((item) => {
                const isActive = matchesPathname(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href as ComponentPropsWithoutRef<typeof Link>["href"]}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-[0.95rem] border px-3.5 py-2.5 text-sm font-semibold transition-colors",
                      isActive
                        ? "border-border bg-surface-strong text-foreground"
                        : "border-transparent bg-transparent text-foreground hover:border-border-soft hover:bg-surface",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full border",
                        isActive
                          ? "border-border bg-foreground"
                          : "border-border-soft bg-transparent",
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-border-soft pt-4">{footer}</div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div
        className={cn(
          "sticky top-0 z-30 border-b border-border-soft bg-background/90 backdrop-blur",
          isSuperAdmin ? "lg:hidden" : "",
        )}
      >
        <div className="slide-grid flex items-center justify-between gap-4 py-4">
          <Link href={homeHref} className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {isSuperAdmin ? "Admin" : "Instruktør"}
              </p>
              <p className="text-sm font-bold text-foreground">
                {activeItem?.label ?? "Indoor Cycling"}
              </p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {footer ? <div>{footer}</div> : null}
            <Button
              type="button"
              variant="contrast"
              size="sm"
              onClick={() => setIsMenuOpen(true)}
            >
              Menu
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen ? (
        <div className={cn("fixed inset-0 z-50", isSuperAdmin ? "lg:hidden" : "")}>
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Luk menu"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(88vw,22rem)] border-r border-border-soft bg-background-muted/95 p-4 shadow-2xl backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Navigation
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Luk
              </Button>
            </div>
            {navContent}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "slide-grid py-6 sm:py-8 lg:py-8",
          isSuperAdmin ? "lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-7" : "",
        )}
      >
        <aside className={cn("sticky top-6 hidden self-start", isSuperAdmin ? "lg:block" : "")}>
          <div className="rounded-[1.5rem] border border-border-soft bg-background-muted/75 p-3.5 shadow-[0_12px_30px_rgba(17,17,17,0.08)] backdrop-blur-sm">
            {navContent}
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
