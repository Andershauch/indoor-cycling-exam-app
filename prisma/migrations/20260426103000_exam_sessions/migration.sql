CREATE TYPE "ExamSessionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

CREATE TABLE "ExamSession" (
    "id" TEXT NOT NULL,
    "examSetId" TEXT NOT NULL,
    "createdByAdminId" TEXT,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "status" "ExamSessionStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Invitation" ADD COLUMN "examSessionId" TEXT;
ALTER TABLE "ParticipantAttempt" ADD COLUMN "examSessionId" TEXT;

CREATE INDEX "ExamSession_examSetId_status_idx" ON "ExamSession"("examSetId", "status");
CREATE INDEX "ExamSession_createdByAdminId_createdAt_idx" ON "ExamSession"("createdByAdminId", "createdAt");
CREATE INDEX "Invitation_examSessionId_status_idx" ON "Invitation"("examSessionId", "status");
CREATE INDEX "ParticipantAttempt_examSessionId_status_idx" ON "ParticipantAttempt"("examSessionId", "status");

ALTER TABLE "ExamSession"
ADD CONSTRAINT "ExamSession_examSetId_fkey"
FOREIGN KEY ("examSetId") REFERENCES "ExamSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExamSession"
ADD CONSTRAINT "ExamSession_createdByAdminId_fkey"
FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invitation"
ADD CONSTRAINT "Invitation_examSessionId_fkey"
FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParticipantAttempt"
ADD CONSTRAINT "ParticipantAttempt_examSessionId_fkey"
FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
