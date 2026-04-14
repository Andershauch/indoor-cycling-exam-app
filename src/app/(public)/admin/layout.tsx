import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell min-h-screen bg-background">
      <main className="slide-grid flex min-h-screen items-center py-10 sm:py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <div className="flex justify-start">
            <BrandLogo size="md" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
