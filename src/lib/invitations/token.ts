import { randomBytes } from "node:crypto";

export function generateInvitationToken() {
  return randomBytes(32).toString("base64url");
}
