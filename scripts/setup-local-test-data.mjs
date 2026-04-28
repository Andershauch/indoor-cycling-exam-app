import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  ExamSessionStatus,
  InvitationChannel,
  InvitationStatus,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function getExpiryDate() {
  const hours = Number(process.env.INVITATION_EXPIRES_HOURS ?? 72);
  return new Date(Date.now() + Math.max(1, hours) * 60 * 60 * 1000);
}

function generateInvitationToken() {
  return randomBytes(32).toString("base64url");
}

async function loadFixture(inputPath) {
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  const content = await readFile(resolvedPath, "utf8");
  return {
    resolvedPath,
    parsed: JSON.parse(content),
  };
}

async function main() {
  const inputPath = process.argv[2] ?? "data/local-test-users.json";
  const { resolvedPath, parsed } = await loadFixture(inputPath);
  const examSet = await prisma.examSet.findFirst({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!examSet) {
    throw new Error(
      "Der findes ingen aktiv prove. Importer forst eksamensdata, for du opretter lokale testbrugere.",
    );
  }

  const configuredAdminEmail = process.env.ADMIN_LOGIN_EMAIL?.trim().toLowerCase() ?? "";
  const configuredAdminName = process.env.ADMIN_LOGIN_NAME?.trim() || "Lokal Admin";

  if (!configuredAdminEmail) {
    throw new Error("ADMIN_LOGIN_EMAIL mangler. Kopier .env.example til .env og prover igen.");
  }

  const adminUser = await prisma.adminUser.upsert({
    where: {
      email: configuredAdminEmail,
    },
    update: {
      name: configuredAdminName,
      isActive: true,
    },
    create: {
      email: configuredAdminEmail,
      name: configuredAdminName,
    },
  });

  const examSession = await prisma.examSession.upsert({
    where: {
      id: "local-test-session",
    },
    update: {
      examSetId: examSet.id,
      createdByAdminId: adminUser.id,
      title: "Lokal testafholdelse",
      location: "Lokal udvikling",
      status: ExamSessionStatus.ACTIVE,
      startsAt: new Date(),
      closedAt: null,
    },
    create: {
      id: "local-test-session",
      examSetId: examSet.id,
      createdByAdminId: adminUser.id,
      title: "Lokal testafholdelse",
      location: "Lokal udvikling",
      status: ExamSessionStatus.ACTIVE,
      startsAt: new Date(),
    },
  });

  const createdInvitations = [];

  for (const participant of parsed.participants ?? []) {
    const channel =
      participant.channel === InvitationChannel.SMS
        ? InvitationChannel.SMS
        : InvitationChannel.EMAIL;

    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        examSetId: examSet.id,
        examSessionId: examSession.id,
        channel,
        recipientEmail: participant.email?.trim() || null,
        recipientPhone: participant.phone?.trim() || null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const invitation = existingInvitation
      ? await prisma.invitation.update({
          where: {
            id: existingInvitation.id,
          },
          data: {
            recipientName: participant.name?.trim() || null,
            examSessionId: examSession.id,
            recipientEmail: participant.email?.trim() || null,
            recipientPhone: participant.phone?.trim() || null,
            status: InvitationStatus.CREATED,
            sentAt: null,
            openedAt: null,
            completedAt: null,
            expiresAt: getExpiryDate(),
            lastDeliveryError: "Lokal testinvitation opdateret via setup-script.",
          },
        })
      : await prisma.invitation.create({
          data: {
            examSetId: examSet.id,
            examSessionId: examSession.id,
            channel,
            status: InvitationStatus.CREATED,
            token: generateInvitationToken(),
            recipientName: participant.name?.trim() || null,
            recipientEmail: participant.email?.trim() || null,
            recipientPhone: participant.phone?.trim() || null,
            expiresAt: getExpiryDate(),
            lastDeliveryError: "Lokal testinvitation oprettet via setup-script.",
          },
        });

    createdInvitations.push({
      name: invitation.recipientName,
      channel: invitation.channel,
      link: `${getAppUrl()}/invite/${invitation.token}`,
    });
  }

  console.log(`Fixture indlaest fra ${resolvedPath}`);
  console.log(`Aktiv prove: ${examSet.title}`);
  console.log(`Prøveafholdelse: ${examSession.title}`);
  console.log(`Admin-login: ${configuredAdminEmail}`);
  console.log("Lokale testinvitationer:");

  for (const invitation of createdInvitations) {
    console.log(`- ${invitation.name} [${invitation.channel}] -> ${invitation.link}`);
  }
}

main()
  .catch((error) => {
    console.error("Opsaetning af lokale testdata fejlede.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
