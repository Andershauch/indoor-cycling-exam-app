import { AdminRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
  await requireAdminSession(AdminRole.SUPER_ADMIN);
  redirect("/admin/status");
}
