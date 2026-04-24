import type { Prisma } from "@prisma/client";
import { headers } from "next/headers";

import { getPrismaClient } from "@/lib/db/prisma";

export type AdminRequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

function getFirstHeaderValue(value: string | null) {
  if (!value) {
    return null;
  }

  const [firstValue] = value.split(",");
  return firstValue?.trim() || null;
}

export async function getAdminRequestContext(): Promise<AdminRequestContext> {
  const headerStore = await headers();

  return {
    ipAddress:
      getFirstHeaderValue(headerStore.get("x-forwarded-for")) ||
      getFirstHeaderValue(headerStore.get("x-real-ip")) ||
      null,
    userAgent: headerStore.get("user-agent")?.trim() || null,
  };
}

export async function createAdminAuditLog(input: {
  adminUserId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await getPrismaClient().adminAuditLog.create({
    data: {
      adminUserId: input.adminUserId ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      targetLabel: input.targetLabel ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    },
  });
}
