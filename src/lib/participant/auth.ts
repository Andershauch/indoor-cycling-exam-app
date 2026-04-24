import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const PARTICIPANT_SESSION_COOKIE = "participant_session";
const PARTICIPANT_SESSION_DURATION_MS = 1000 * 60 * 60;

type ParticipantSessionPayload = {
  invitationId: string;
  nonce: string;
  expiresAt: number;
};

function getParticipantSessionSecret() {
  const secret =
    process.env.PARTICIPANT_SESSION_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("PARTICIPANT_SESSION_SECRET mangler i miljøvariablerne.");
  }

  return secret;
}

function signPayload(payload: string) {
  return createHmac("sha256", getParticipantSessionSecret())
    .update(payload)
    .digest("hex");
}

function hashNonce(nonce: string) {
  return createHash("sha256")
    .update(`${getParticipantSessionSecret()}:${nonce}`)
    .digest("hex");
}

function encodeSession(payload: ParticipantSessionPayload) {
  const serialised = `${payload.invitationId}|${payload.nonce}|${payload.expiresAt}`;
  return `${Buffer.from(serialised, "utf8").toString("base64url")}.${signPayload(serialised)}`;
}

function decodeSession(token: string): ParticipantSessionPayload | null {
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

  const [invitationId, nonce, expiresAt] = payload.split("|");

  if (!invitationId || !nonce || !expiresAt) {
    return null;
  }

  const numericExpiresAt = Number(expiresAt);

  if (!Number.isFinite(numericExpiresAt)) {
    return null;
  }

  return {
    invitationId,
    nonce,
    expiresAt: numericExpiresAt,
  };
}

export function getParticipantSessionDurationMs() {
  return PARTICIPANT_SESSION_DURATION_MS;
}

export function generateParticipantSessionNonce() {
  return randomBytes(32).toString("base64url");
}

export function hashParticipantSessionNonce(nonce: string) {
  return hashNonce(nonce);
}

export async function createParticipantSession(input: {
  invitationId: string;
  nonce: string;
  expiresAt?: Date;
}) {
  const expiresAt =
    input.expiresAt ?? new Date(Date.now() + PARTICIPANT_SESSION_DURATION_MS);
  const cookieStore = await cookies();

  cookieStore.set(
    PARTICIPANT_SESSION_COOKIE,
    encodeSession({
      invitationId: input.invitationId,
      nonce: input.nonce,
      expiresAt: expiresAt.getTime(),
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    },
  );

  return expiresAt;
}

export async function clearParticipantSession() {
  const cookieStore = await cookies();
  cookieStore.delete(PARTICIPANT_SESSION_COOKIE);
}

export async function getParticipantSession() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;

  if (!rawCookie) {
    return null;
  }

  const session = decodeSession(rawCookie);

  if (!session || session.expiresAt <= Date.now()) {
    return null;
  }

  return session;
}

export async function doesParticipantSessionMatchInvitation(input: {
  invitationId: string;
  expectedNonceHash: string | null;
  expectedExpiresAt: Date | null;
}) {
  const session = await getParticipantSession();

  if (
    !session ||
    session.invitationId !== input.invitationId ||
    !input.expectedNonceHash ||
    !input.expectedExpiresAt ||
    input.expectedExpiresAt.getTime() <= Date.now()
  ) {
    return false;
  }

  const actualHash = hashNonce(session.nonce);
  const actualBuffer = Buffer.from(actualHash, "utf8");
  const expectedBuffer = Buffer.from(input.expectedNonceHash, "utf8");

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}
