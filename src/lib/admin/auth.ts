import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { AdminRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createAdminAuditLog, getAdminRequestContext } from "@/lib/admin/audit";
import {
  assertAdminMagicLinkRateLimit,
  recordAdminMagicLinkRequest,
} from "@/lib/admin/rate-limit";
import { getAppEnv } from "@/lib/config/app-env";
import { getPrismaClient } from "@/lib/db/prisma";

const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

type AdminSessionPayload = {
  adminUserId: string;
  role: AdminRole;
  expiresAt: number;
};

function normaliseEmail(value: string) {
  return value.trim().toLowerCase();
}

function getAdminSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() || process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET mangler i miljøvariablerne.");
  }

  return secret;
}

function getAdminConfig() {
  const superAdminEmail = normaliseEmail(
    process.env.SUPER_ADMIN_EMAIL ?? process.env.ADMIN_LOGIN_EMAIL ?? "",
  );
  const superAdminName =
    process.env.SUPER_ADMIN_NAME?.trim() ||
    process.env.ADMIN_LOGIN_NAME?.trim() ||
    "Super Admin";
  const expiresMinutes = Math.max(
    5,
    Number(process.env.ADMIN_MAGIC_LINK_EXPIRES_MINUTES ?? 20),
  );
  const throttleSeconds = Math.max(
    30,
    Number(process.env.ADMIN_MAGIC_LINK_THROTTLE_SECONDS ?? 60),
  );

  return {
    superAdminEmail,
    superAdminName,
    expiresMinutes,
    throttleSeconds,
  };
}

export function isAdminLoginConfigured() {
  const config = getAdminConfig();
  return Boolean(
    config.superAdminEmail &&
      (process.env.ADMIN_SESSION_SECRET?.trim() || process.env.AUTH_SECRET?.trim()),
  );
}

export function isBootstrapSuperAdminEmail(email: string) {
  return normaliseEmail(email) === getAdminConfig().superAdminEmail;
}

function signPayload(payload: string) {
  return createHmac("sha256", getAdminSecret()).update(payload).digest("hex");
}

function hashMagicLinkToken(token: string) {
  return createHash("sha256")
    .update(`${getAdminSecret()}:${token}`)
    .digest("hex");
}

function encodeSession(payload: AdminSessionPayload) {
  const serialised = `${payload.adminUserId}|${payload.role}|${payload.expiresAt}`;
  return `${Buffer.from(serialised, "utf8").toString("base64url")}.${signPayload(serialised)}`;
}

function decodeSession(token: string): AdminSessionPayload | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const expectedSignature = signPayload(payload);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return null;
  }

  const [adminUserId, role, expiresAt] = payload.split("|");

  if (
    !adminUserId ||
    (role !== AdminRole.SUPER_ADMIN && role !== AdminRole.EDITOR) ||
    !expiresAt
  ) {
    return null;
  }

  const numericExpiresAt = Number(expiresAt);

  if (!Number.isFinite(numericExpiresAt)) {
    return null;
  }

  return {
    adminUserId,
    role,
    expiresAt: numericExpiresAt,
  };
}

async function sendAdminMagicLinkEmail(input: {
  email: string;
  name: string;
  magicLink: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim() || process.env.MAIL_PROVIDER_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !fromEmail) {
    throw new Error("Magic link-mail kan ikke sendes, fordi mailopsætning mangler.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.email],
      subject: "Dit admin-login til indoor cycling",
      text: [
        `Hej ${input.name},`,
        "",
        "Brug dette link for at logge ind i admin:",
        input.magicLink,
        "",
        "Linket virker kun én gang og udløber automatisk.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; color: #111111; line-height: 1.6;">
          <p>Hej ${input.name},</p>
          <p>Brug dette link for at logge ind i admin:</p>
          <p>
            <a href="${input.magicLink}" style="display:inline-block;padding:12px 18px;background:#FEE81F;color:#111111;text-decoration:none;font-weight:700;border-radius:8px;">
              Log ind i admin
            </a>
          </p>
          <p>Hvis knappen ikke virker, kan du åbne linket direkte:</p>
          <p><a href="${input.magicLink}">${input.magicLink}</a></p>
          <p>Linket virker kun én gang og udløber automatisk.</p>
        </div>
      `.trim(),
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(payload?.message || "Magic link-mail kunne ikke sendes.");
  }
}

async function ensureBootstrapSuperAdmin() {
  const config = getAdminConfig();

  if (!config.superAdminEmail) {
    return null;
  }

  return getPrismaClient().adminUser.upsert({
    where: {
      email: config.superAdminEmail,
    },
    update: {
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
      name: config.superAdminName,
    },
    create: {
      email: config.superAdminEmail,
      name: config.superAdminName,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });
}

async function findLoginEligibleAdmin(email: string) {
  const normalisedEmail = normaliseEmail(email);

  if (isBootstrapSuperAdminEmail(normalisedEmail)) {
    return ensureBootstrapSuperAdmin();
  }

  return getPrismaClient().adminUser.findUnique({
    where: {
      email: normalisedEmail,
    },
  });
}

export async function issueAdminMagicLink(email: string) {
  if (!isAdminLoginConfigured()) {
    throw new Error("Admin-login er ikke konfigureret endnu.");
  }

  const normalisedEmail = normaliseEmail(email);
  const requestContext = await getAdminRequestContext();

  try {
    await assertAdminMagicLinkRateLimit({
      email: normalisedEmail,
      ipAddress: requestContext.ipAddress,
    });
  } catch (error) {
    await recordAdminMagicLinkRequest({
      email: normalisedEmail,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      outcome: "RATE_LIMITED",
    });
    await createAdminAuditLog({
      action: "ADMIN_MAGIC_LINK_RATE_LIMITED",
      targetType: "admin_login",
      targetLabel: normalisedEmail,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    });
    throw error;
  }

  const adminUser = await findLoginEligibleAdmin(normalisedEmail);

  if (!adminUser || !adminUser.isActive) {
    await recordAdminMagicLinkRequest({
      email: normalisedEmail,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      outcome: "REJECTED",
    });
    await createAdminAuditLog({
      action: "ADMIN_MAGIC_LINK_REJECTED",
      targetType: "admin_login",
      targetLabel: normalisedEmail,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    });
    return { delivered: false as const };
  }

  const prisma = getPrismaClient();
  const config = getAdminConfig();
  const now = new Date();

  if (
    adminUser.lastMagicLinkSentAt &&
    now.getTime() - adminUser.lastMagicLinkSentAt.getTime() <
      config.throttleSeconds * 1000
  ) {
    await recordAdminMagicLinkRequest({
      email: normalisedEmail,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      outcome: "THROTTLED",
    });
    await createAdminAuditLog({
      adminUserId: adminUser.id,
      action: "ADMIN_MAGIC_LINK_THROTTLED",
      targetType: "admin_user",
      targetId: adminUser.id,
      targetLabel: adminUser.email,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadata: {
        throttleSeconds: config.throttleSeconds,
      },
    });
    return { delivered: true as const };
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashMagicLinkToken(rawToken);
  const expiresAt = new Date(now.getTime() + config.expiresMinutes * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.adminMagicLinkToken.create({
      data: {
        adminUserId: adminUser.id,
        tokenHash,
        expiresAt,
      },
    });

    await tx.adminUser.update({
      where: {
        id: adminUser.id,
      },
      data: {
        lastMagicLinkSentAt: now,
      },
    });
  });

  const magicLink = `${getAppEnv().appUrl}/admin/login/verify?token=${encodeURIComponent(rawToken)}`;
  try {
    await sendAdminMagicLinkEmail({
      email: adminUser.email,
      name: adminUser.name,
      magicLink,
    });
  } catch (error) {
    await recordAdminMagicLinkRequest({
      email: normalisedEmail,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      outcome: "FAILED",
    });
    await createAdminAuditLog({
      adminUserId: adminUser.id,
      action: "ADMIN_MAGIC_LINK_SEND_FAILED",
      targetType: "admin_user",
      targetId: adminUser.id,
      targetLabel: adminUser.email,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadata: {
        message: error instanceof Error ? error.message : "Ukendt fejl",
      },
    });
    throw error;
  }

  await recordAdminMagicLinkRequest({
    email: normalisedEmail,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
    outcome: "SENT",
  });
  await createAdminAuditLog({
    adminUserId: adminUser.id,
    action: "ADMIN_MAGIC_LINK_SENT",
    targetType: "admin_user",
    targetId: adminUser.id,
    targetLabel: adminUser.email,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
  });

  return { delivered: true as const };
}

export async function createAdminSession(adminUser: {
  id: string;
  role: AdminRole;
}) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const cookieStore = await cookies();

  cookieStore.set(
    ADMIN_SESSION_COOKIE,
    encodeSession({
      adminUserId: adminUser.id,
      role: adminUser.role,
      expiresAt,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(expiresAt),
    },
  );
}

export async function consumeAdminMagicLink(rawToken: string) {
  const tokenHash = hashMagicLinkToken(rawToken);
  const prisma = getPrismaClient();
  const now = new Date();
  const requestContext = await getAdminRequestContext();

  const record = await prisma.adminMagicLinkToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      adminUser: true,
    },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= now.getTime()) {
    await createAdminAuditLog({
      action: "ADMIN_MAGIC_LINK_CONSUME_FAILED",
      targetType: "admin_magic_link",
      targetLabel: "invalid-or-expired",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    });
    return null;
  }

  const adminUser =
    isBootstrapSuperAdminEmail(record.adminUser.email)
      ? await ensureBootstrapSuperAdmin()
      : record.adminUser;

  if (!adminUser || !adminUser.isActive) {
    await createAdminAuditLog({
      action: "ADMIN_MAGIC_LINK_CONSUME_REJECTED",
      targetType: "admin_user",
      targetId: record.adminUser.id,
      targetLabel: record.adminUser.email,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    });
    return null;
  }

  await prisma.adminMagicLinkToken.update({
    where: {
      id: record.id,
    },
    data: {
      usedAt: now,
    },
  });

  await createAdminSession(adminUser);
  await createAdminAuditLog({
    adminUserId: adminUser.id,
    action: "ADMIN_MAGIC_LINK_CONSUMED",
    targetType: "admin_user",
    targetId: adminUser.id,
    targetLabel: adminUser.email,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
  });
  return adminUser;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!rawToken) {
    return null;
  }

  const token = decodeSession(rawToken);

  if (!token || token.expiresAt <= Date.now()) {
    cookieStore.delete(ADMIN_SESSION_COOKIE);
    return null;
  }

  const adminUser = await getPrismaClient().adminUser.findUnique({
    where: {
      id: token.adminUserId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!adminUser) {
    cookieStore.delete(ADMIN_SESSION_COOKIE);
    return null;
  }

  if (isBootstrapSuperAdminEmail(adminUser.email)) {
    const bootstrapped = await ensureBootstrapSuperAdmin();

    if (!bootstrapped || token.role !== AdminRole.SUPER_ADMIN) {
      cookieStore.delete(ADMIN_SESSION_COOKIE);
      return null;
    }

    return {
      id: bootstrapped.id,
      email: bootstrapped.email,
      name: bootstrapped.name,
      role: bootstrapped.role,
      isActive: bootstrapped.isActive,
    };
  }

  if (!adminUser.isActive || token.role !== adminUser.role) {
    cookieStore.delete(ADMIN_SESSION_COOKIE);
    return null;
  }

  return adminUser;
}

function roleSatisfiesRequirement(actualRole: AdminRole, requiredRole: AdminRole) {
  if (actualRole === AdminRole.SUPER_ADMIN) {
    return true;
  }

  return actualRole === requiredRole;
}

export async function requireAdminSession(requiredRole: AdminRole = AdminRole.EDITOR) {
  const session = await getAdminSession();

  if (!session || !roleSatisfiesRequirement(session.role, requiredRole)) {
    redirect("/admin/login");
  }

  return session;
}
