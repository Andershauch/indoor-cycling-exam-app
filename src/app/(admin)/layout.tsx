import type { ReactNode } from "react";

import { AdminShellChrome } from "@/components/admin/admin-shell-chrome";
import { Button } from "@/components/ui/button";
import { logoutAdminAction } from "@/lib/admin/actions";
import { requireAdminSession } from "@/lib/admin/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();

  return (
    <div className="app-shell">
      <AdminShellChrome
        role={session.role}
        name={session.name}
        email={session.email}
        footer={
          <form action={logoutAdminAction}>
            <Button type="submit" variant="contrast" size="sm" className="w-full">
              Log ud
            </Button>
          </form>
        }
      >
        {children}
      </AdminShellChrome>
    </div>
  );
}
