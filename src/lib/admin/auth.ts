import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

function getAdminSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() || process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET mangler i miljøvariablerne.");
  }

  return secret;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(payload: string) {
  return createHmac("sha256", getAdminSecret()).update(payload).digest("hex");
}

function encodeToken(payload: string) {
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${signPayload(payload)}`;
}

function decodeToken(token: string) {
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

  const [email, expiresAt] = payload.split("|");

  if (!email || !expiresAt) {
    return null;
  }

  return {
    email,
    expiresAt: Number(expiresAt),
  };
}

export function getAdminLoginConfig() {
  return {
    email: process.env.ADMIN_LOGIN_EMAIL?.trim().toLowerCase() ?? "",
    password: process.env.ADMIN_LOGIN_PASSWORD?.trim() ?? "",
    name: process.env.ADMIN_LOGIN_NAME?.trim() ?? "Admin",
  };
}

export function isAdminLoginConfigured() {
  const config = getAdminLoginConfig();
  return Boolean(
    config.email &&
      config.password &&
      (process.env.ADMIN_SESSION_SECRET?.trim() || process.env.AUTH_SECRET?.trim()),
  );
}

export function verifyAdminCredentials(email: string, password: string) {
  const config = getAdminLoginConfig();

  return safeEqual(email, config.email) && safeEqual(password, config.password);
}

export async function createAdminSession(email: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, encodeToken(`${email}|${expiresAt}`), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
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

  const token = decodeToken(rawToken);
  const config = getAdminLoginConfig();

  if (!token || token.expiresAt <= Date.now() || token.email !== config.email) {
    cookieStore.delete(ADMIN_SESSION_COOKIE);
    return null;
  }

  return {
    email: config.email,
    name: config.name,
  };
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
