ALTER TYPE "InvitationStatus" RENAME TO "InvitationStatus_old";

CREATE TYPE "InvitationStatus" AS ENUM (
  'CREATED',
  'SENT',
  'OPENED',
  'COMPLETED',
  'EXPIRED'
);

ALTER TABLE "Invitation"
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "lastDeliveryError" TEXT;

ALTER TABLE "Invitation"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "InvitationStatus"
  USING (
    CASE "status"::text
      WHEN 'DRAFT' THEN 'CREATED'
      WHEN 'SENT' THEN 'SENT'
      WHEN 'OPENED' THEN 'OPENED'
      WHEN 'ACCEPTED' THEN 'COMPLETED'
      WHEN 'EXPIRED' THEN 'EXPIRED'
      WHEN 'REVOKED' THEN 'EXPIRED'
    END
  )::"InvitationStatus",
  ALTER COLUMN "status" SET DEFAULT 'CREATED';

UPDATE "Invitation"
SET "completedAt" = COALESCE("completedAt", "acceptedAt", "openedAt")
WHERE "status" = 'COMPLETED';

ALTER TABLE "Invitation"
  DROP COLUMN "acceptedAt",
  DROP COLUMN "revokedAt";

DROP TYPE "InvitationStatus_old";
