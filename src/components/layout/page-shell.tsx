import type { ReactNode } from "react";

import { PageHeader } from "@/components/ui/page-header";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  aside?: ReactNode;
};

export function PageShell({
  eyebrow,
  title,
  description,
  children,
  aside,
}: PageShellProps) {
  return (
    <section className="slide-grid grid gap-6 py-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 lg:py-10">
      <div className="space-y-6">
        <PageHeader eyebrow={eyebrow} title={title} description={description} />
        {children}
      </div>
      <aside className="space-y-4 lg:pt-24">{aside}</aside>
    </section>
  );
}
