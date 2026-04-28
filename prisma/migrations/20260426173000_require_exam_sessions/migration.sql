-- Backfill legacy rows before enforcing that invitations and attempts belong to an exam session.
-- One legacy session is created per exam format/admin pair where old invitation data exists,
-- plus one per exam format for old attempts that cannot be tied to an invitation/admin.

INSERT INTO "ExamSession" (
    "id",
    "examSetId",
    "createdByAdminId",
    "title",
    "location",
    "status",
    "startsAt",
    "closedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'legacy-' || md5("Invitation"."examSetId" || ':' || COALESCE("Invitation"."createdByAdminId", 'none')),
    "Invitation"."examSetId",
    "Invitation"."createdByAdminId",
    'Migreret afholdelse - ' || "ExamSet"."title",
    'Migreret fra data uden prøveafholdelse',
    'CLOSED'::"ExamSessionStatus",
    MIN("Invitation"."createdAt"),
    CURRENT_TIMESTAMP,
    MIN("Invitation"."createdAt"),
    CURRENT_TIMESTAMP
FROM "Invitation"
JOIN "ExamSet" ON "ExamSet"."id" = "Invitation"."examSetId"
WHERE "Invitation"."examSessionId" IS NULL
GROUP BY "Invitation"."examSetId", "Invitation"."createdByAdminId", "ExamSet"."title"
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ExamSession" (
    "id",
    "examSetId",
    "createdByAdminId",
    "title",
    "location",
    "status",
    "startsAt",
    "closedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'legacy-' || md5("ParticipantAttempt"."examSetId" || ':none'),
    "ParticipantAttempt"."examSetId",
    NULL,
    'Migreret afholdelse - ' || "ExamSet"."title",
    'Migreret fra data uden prøveafholdelse',
    'CLOSED'::"ExamSessionStatus",
    MIN("ParticipantAttempt"."startedAt"),
    CURRENT_TIMESTAMP,
    MIN("ParticipantAttempt"."createdAt"),
    CURRENT_TIMESTAMP
FROM "ParticipantAttempt"
JOIN "ExamSet" ON "ExamSet"."id" = "ParticipantAttempt"."examSetId"
LEFT JOIN "Invitation" ON "Invitation"."id" = "ParticipantAttempt"."invitationId"
WHERE "ParticipantAttempt"."examSessionId" IS NULL
  AND "Invitation"."examSessionId" IS NULL
GROUP BY "ParticipantAttempt"."examSetId", "ExamSet"."title"
ON CONFLICT ("id") DO NOTHING;

UPDATE "Invitation"
SET "examSessionId" = 'legacy-' || md5("Invitation"."examSetId" || ':' || COALESCE("Invitation"."createdByAdminId", 'none'))
WHERE "examSessionId" IS NULL;

UPDATE "ParticipantAttempt"
SET "examSessionId" = "Invitation"."examSessionId"
FROM "Invitation"
WHERE "ParticipantAttempt"."invitationId" = "Invitation"."id"
  AND "ParticipantAttempt"."examSessionId" IS NULL
  AND "Invitation"."examSessionId" IS NOT NULL;

UPDATE "ParticipantAttempt"
SET "examSessionId" = 'legacy-' || md5("examSetId" || ':none')
WHERE "examSessionId" IS NULL;

ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_examSessionId_fkey";
ALTER TABLE "ParticipantAttempt" DROP CONSTRAINT "ParticipantAttempt_examSessionId_fkey";

ALTER TABLE "Invitation" ALTER COLUMN "examSessionId" SET NOT NULL;
ALTER TABLE "ParticipantAttempt" ALTER COLUMN "examSessionId" SET NOT NULL;

ALTER TABLE "Invitation"
ADD CONSTRAINT "Invitation_examSessionId_fkey"
FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ParticipantAttempt"
ADD CONSTRAINT "ParticipantAttempt_examSessionId_fkey"
FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
