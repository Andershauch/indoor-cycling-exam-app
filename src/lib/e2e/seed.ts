import {
  ExamSessionStatus,
  InvitationChannel,
  InvitationStatus,
  Prisma,
} from "@prisma/client";

import { getPrismaClient } from "@/lib/db/prisma";
import { getAppEnv } from "@/lib/config/app-env";
import { generateInvitationToken } from "@/lib/invitations/token";

const EXAM_SLUG = "playwright-e2e-flow";
const QUESTION_PREFIX = "playwright-e2e";
const SESSION_TITLE_PREFIX = "Playwright E2E afholdelse";

type SeedQuestion = {
  externalKey: string;
  questionText: string;
  explanation: string;
  options: Array<{ label: string; text: string; isCorrect: boolean }>;
};

const QUESTIONS: SeedQuestion[] = [
  {
    externalKey: `${QUESTION_PREFIX}-01`,
    questionText: "Hvor lang tid har deltageren til at gennemføre prøven?",
    explanation: "Prøven er sat op med 30 minutters tidsgrænse.",
    options: [
      { label: "A", text: "15 minutter", isCorrect: false },
      { label: "B", text: "30 minutter", isCorrect: true },
      { label: "C", text: "45 minutter", isCorrect: false },
      { label: "D", text: "60 minutter", isCorrect: false },
    ],
  },
  {
    externalKey: `${QUESTION_PREFIX}-02`,
    questionText: "Må deltageren gå tilbage og ændre svar før aflevering?",
    explanation: "Deltageren må navigere frit indtil aflevering.",
    options: [
      { label: "A", text: "Nej, aldrig", isCorrect: false },
      { label: "B", text: "Kun hvis underviseren giver lov", isCorrect: false },
      { label: "C", text: "Ja, indtil aflevering eller tiden udløber", isCorrect: true },
      { label: "D", text: "Kun på mobil", isCorrect: false },
    ],
  },
];

export async function ensureE2EExamSet(adminUserId: string) {
  const prisma = getPrismaClient();

  const examSet = await prisma.examSet.upsert({
    where: {
      slug: EXAM_SLUG,
    },
    update: {
      title: "Playwright E2E prøve",
      description: "Automatiseret testprøve til end-to-end flow.",
      version: 1,
      timeLimitMinutes: 30,
      passPercentage: 60,
      isActive: false,
      publishedAt: new Date(),
      createdByAdminId: adminUserId,
    },
    create: {
      slug: EXAM_SLUG,
      title: "Playwright E2E prøve",
      description: "Automatiseret testprøve til end-to-end flow.",
      version: 1,
      timeLimitMinutes: 30,
      passPercentage: 60,
      isActive: false,
      publishedAt: new Date(),
      createdByAdminId: adminUserId,
    },
  });

  for (const [index, seedQuestion] of QUESTIONS.entries()) {
    const question = await prisma.question.upsert({
      where: {
        externalKey: seedQuestion.externalKey,
      },
      update: {
        questionText: seedQuestion.questionText,
        explanation: seedQuestion.explanation,
        category: "Playwright",
      },
      create: {
        externalKey: seedQuestion.externalKey,
        questionText: seedQuestion.questionText,
        explanation: seedQuestion.explanation,
        category: "Playwright",
      },
    });

    const existingOptions = await prisma.answerOption.findMany({
      where: {
        questionId: question.id,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    await prisma.$transaction(async (tx) => {
      for (const [optionIndex, option] of seedQuestion.options.entries()) {
        const existingOption = existingOptions[optionIndex];

        if (existingOption) {
          await tx.answerOption.update({
            where: {
              id: existingOption.id,
            },
            data: {
              label: option.label,
              optionText: option.text,
              isCorrect: option.isCorrect,
              sortOrder: optionIndex + 1,
            },
          });
        } else {
          await tx.answerOption.create({
            data: {
              questionId: question.id,
              label: option.label,
              optionText: option.text,
              isCorrect: option.isCorrect,
              sortOrder: optionIndex + 1,
            },
          });
        }
      }

      const extraOptionIds = existingOptions
        .slice(seedQuestion.options.length)
        .map((option) => option.id);

      if (extraOptionIds.length > 0) {
        await tx.answerOption.deleteMany({
          where: {
            id: {
              in: extraOptionIds,
            },
          },
        });
      }
    });

    await prisma.examQuestion.upsert({
      where: {
        examSetId_questionId: {
          examSetId: examSet.id,
          questionId: question.id,
        },
      },
      update: {
        position: index + 1,
      },
      create: {
        examSetId: examSet.id,
        questionId: question.id,
        position: index + 1,
      },
    });
  }

  const activeQuestionKeys = QUESTIONS.map((question) => question.externalKey);
  const staleExamQuestions = await prisma.examQuestion.findMany({
    where: {
      examSetId: examSet.id,
      question: {
        externalKey: {
          notIn: activeQuestionKeys,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (staleExamQuestions.length > 0) {
    await prisma.examQuestion.deleteMany({
      where: {
        id: {
          in: staleExamQuestions.map((entry) => entry.id),
        },
      },
    });
  }

  return examSet;
}

export async function createE2EInvitation(input: {
  examSetId: string;
  examSessionId: string;
  adminUserId: string;
  participantName: string;
  participantEmail: string;
}) {
  const invitation = await getPrismaClient().invitation.create({
    data: {
      examSetId: input.examSetId,
      examSessionId: input.examSessionId,
      createdByAdminId: input.adminUserId,
      channel: InvitationChannel.EMAIL,
      status: InvitationStatus.SENT,
      token: generateInvitationToken(),
      recipientName: input.participantName,
      recipientEmail: input.participantEmail,
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    },
  });

  return {
    invitationId: invitation.id,
    invitationLink: `${getAppEnv().appUrl}/invite/${invitation.token}`,
  };
}

export async function ensureE2EExamSession(input: {
  examSetId: string;
  adminUserId: string;
}) {
  const prisma = getPrismaClient();
  const title = `${SESSION_TITLE_PREFIX} ${new Date().toISOString().slice(0, 10)}`;

  return prisma.examSession.create({
    data: {
      examSetId: input.examSetId,
      createdByAdminId: input.adminUserId,
      title,
      location: "Automatisk E2E",
      status: ExamSessionStatus.ACTIVE,
      startsAt: new Date(),
    },
  });
}

export async function resetE2EInvitations() {
  const prisma = getPrismaClient();

  const invitations = await prisma.invitation.findMany({
    where: {
      OR: [
        {
          recipientEmail: {
            startsWith: "playwright-e2e+",
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          recipientName: {
            startsWith: "Playwright E2E",
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (invitations.length > 0) {
    await prisma.participantAttempt.deleteMany({
      where: {
        invitationId: {
          in: invitations.map((invitation) => invitation.id),
        },
      },
    });

    await prisma.invitation.deleteMany({
      where: {
        id: {
          in: invitations.map((invitation) => invitation.id),
        },
      },
    });
  }

  await prisma.participantAttempt.deleteMany({
    where: {
      examSession: {
        title: {
          startsWith: SESSION_TITLE_PREFIX,
        },
      },
    },
  });

  await prisma.examSession.deleteMany({
    where: {
      title: {
        startsWith: SESSION_TITLE_PREFIX,
      },
    },
  });
}
