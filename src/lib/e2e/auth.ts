import { AdminRole } from "@prisma/client";

import { createAdminSession } from "@/lib/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";

function getE2ESecret() {
  return process.env.PLAYWRIGHT_E2E_SECRET?.trim() || "";
}

export function assertE2EAccess(secret: string | null) {
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("E2E helper routes are disabled in Vercel production.");
  }

  const expectedSecret = getE2ESecret();

  if (!expectedSecret) {
    throw new Error("PLAYWRIGHT_E2E_SECRET mangler.");
  }

  if (!secret || secret !== expectedSecret) {
    throw new Error("Ugyldig e2e-secret.");
  }
}

export async function ensureE2EAdminSession() {
  const prisma = getPrismaClient();
  const email =
    process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() ||
    process.env.ADMIN_LOGIN_EMAIL?.trim().toLowerCase() ||
    "e2e-admin@local.test";
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "E2E Superadmin";

  const adminUser = await prisma.adminUser.upsert({
    where: {
      email,
    },
    update: {
      name,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email,
      name,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  await createAdminSession({
    id: adminUser.id,
    role: adminUser.role,
  });

  return adminUser;
}
