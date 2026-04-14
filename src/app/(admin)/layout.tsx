import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { requireAdminSession } from "@/lib/admin/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminSession();

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <SiteHeader compact />
      <main className="flex-1">{children}</main>
    </div>
  );
}
