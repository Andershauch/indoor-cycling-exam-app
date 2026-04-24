ALTER TABLE "AdminUser"
ADD COLUMN "lastMagicLinkSentAt" TIMESTAMP(3);

CREATE TABLE "AdminMagicLinkToken" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminMagicLinkToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminMagicLinkToken_tokenHash_key" ON "AdminMagicLinkToken"("tokenHash");
CREATE INDEX "AdminMagicLinkToken_adminUserId_expiresAt_idx" ON "AdminMagicLinkToken"("adminUserId", "expiresAt");

ALTER TABLE "AdminMagicLinkToken"
ADD CONSTRAINT "AdminMagicLinkToken_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
