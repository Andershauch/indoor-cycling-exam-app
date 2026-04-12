import type { ReactNode } from "react";

import { requireAdminSession } from "@/lib/admin/auth";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminSession();

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <SiteHeader compact />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
