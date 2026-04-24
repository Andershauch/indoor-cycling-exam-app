-- Add single-active-session tracking for invitation-based participant access.
ALTER TABLE "Invitation"
ADD COLUMN "participantSessionNonceHash" TEXT,
ADD COLUMN "participantSessionExpiresAt" TIMESTAMP(3);
