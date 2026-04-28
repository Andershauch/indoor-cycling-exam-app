import { AdminRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
  const session = await requireAdminSession();

  if (session.role === AdminRole.SUPER_ADMIN) {
    redirect("/admin/status");
  }

  redirect("/admin");
}
