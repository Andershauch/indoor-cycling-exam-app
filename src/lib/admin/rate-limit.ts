import { getPrismaClient } from "@/lib/db/prisma";

const DEFAULT_WINDOW_MINUTES = 15;
const DEFAULT_MAX_PER_EMAIL = 5;
const DEFAULT_MAX_PER_IP = 25;

function getRateLimitConfig() {
  return {
    windowMinutes: Math.max(
      5,
      Number(process.env.ADMIN_MAGIC_LINK_RATE_LIMIT_WINDOW_MINUTES ?? DEFAULT_WINDOW_MINUTES),
    ),
    maxPerEmail: Math.max(
      3,
      Number(process.env.ADMIN_MAGIC_LINK_RATE_LIMIT_MAX_PER_EMAIL ?? DEFAULT_MAX_PER_EMAIL),
    ),
    maxPerIp: Math.max(
      10,
      Number(process.env.ADMIN_MAGIC_LINK_RATE_LIMIT_MAX_PER_IP ?? DEFAULT_MAX_PER_IP),
    ),
  };
}

export async function assertAdminMagicLinkRateLimit(input: {
  email: string;
  ipAddress: string | null;
}) {
  const prisma = getPrismaClient();
  const config = getRateLimitConfig();
  const cutoff = new Date(Date.now() - config.windowMinutes * 60 * 1000);

  const [emailRequestCount, ipRequestCount] = await Promise.all([
    prisma.adminMagicLinkRequest.count({
      where: {
        email: input.email,
        createdAt: {
          gte: cutoff,
        },
      },
    }),
    input.ipAddress
      ? prisma.adminMagicLinkRequest.count({
          where: {
            ipAddress: input.ipAddress,
            createdAt: {
              gte: cutoff,
            },
          },
        })
      : Promise.resolve(0),
  ]);

  if (emailRequestCount >= config.maxPerEmail || ipRequestCount >= config.maxPerIp) {
    throw new Error("For mange admin-loginforsog. Vent lidt og prov igen.");
  }
}

export async function recordAdminMagicLinkRequest(input: {
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  outcome: string;
}) {
  await getPrismaClient().adminMagicLinkRequest.create({
    data: {
      email: input.email,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      outcome: input.outcome,
    },
  });
}
