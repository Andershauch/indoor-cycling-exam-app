import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });
config();

const prisma = new PrismaClient();

async function countRows(query) {
  const [row] = await prisma.$queryRawUnsafe(query);
  return Number(row?.count ?? 0);
}

async function main() {
  const checks = [
    {
      label: "Invitationer uden prøveafholdelse",
      query: 'SELECT COUNT(*)::int AS count FROM "Invitation" WHERE "examSessionId" IS NULL',
    },
    {
      label: "Forsøg uden prøveafholdelse",
      query:
        'SELECT COUNT(*)::int AS count FROM "ParticipantAttempt" WHERE "examSessionId" IS NULL',
    },
    {
      label: "Invitationer hvor prøveformat og afholdelse ikke matcher",
      query: `
        SELECT COUNT(*)::int AS count
        FROM "Invitation"
        JOIN "ExamSession" ON "ExamSession"."id" = "Invitation"."examSessionId"
        WHERE "Invitation"."examSetId" <> "ExamSession"."examSetId"
      `,
    },
    {
      label: "Forsøg hvor prøveformat og afholdelse ikke matcher",
      query: `
        SELECT COUNT(*)::int AS count
        FROM "ParticipantAttempt"
        JOIN "ExamSession" ON "ExamSession"."id" = "ParticipantAttempt"."examSessionId"
        WHERE "ParticipantAttempt"."examSetId" <> "ExamSession"."examSetId"
      `,
    },
  ];

  const failures = [];

  for (const check of checks) {
    const count = await countRows(check.query);

    if (count > 0) {
      failures.push(`${check.label}: ${count}`);
    }
  }

  if (failures.length > 0) {
    console.error("[data-integrity] Fejl fundet:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("[data-integrity] All checks passed.");
}

main()
  .catch((error) => {
    console.error("[data-integrity] Kunne ikke kontrollere data.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
