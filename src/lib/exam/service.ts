import { AttemptStatus, Prisma } from "@prisma/client";

import { getPrismaClient } from "@/lib/db/prisma";
import type {
  AttemptExamSnapshot,
  AttemptQuestionState,
  ExamQuestionView,
} from "@/lib/exam/types";
import { getParticipantSession } from "@/lib/participant/auth";

function decimalToNumber(value: Prisma.Decimal | null) {
  return value ? Number(value) : null;
}

function mapQuestions(
  examQuestions: Array<{
    id: string;
    position: number;
    question: {
      id: string;
      category: string | null;
      questionText: string;
      explanation: string | null;
      options: Array<{
        id: string;
        label: string;
        optionText: string;
        isCorrect: boolean;
        sortOrder: number;
      }>;
    };
  }>,
  revealCorrectAnswers: boolean,
): ExamQuestionView[] {
  return examQuestions.map((examQuestion) => ({
    examQuestionId: examQuestion.id,
    questionId: examQuestion.question.id,
    position: examQuestion.position,
    category: examQuestion.question.category,
    questionText: examQuestion.question.questionText,
    explanation: examQuestion.question.explanation,
    options: examQuestion.question.options
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((option) => ({
        id: option.id,
        label: option.label,
        text: option.optionText,
        isCorrect: revealCorrectAnswers ? option.isCorrect : false,
      })),
  }));
}

function mapAnswers(
  answers: Array<{
    examQuestionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean | null;
    answeredAt: Date | null;
  }>,
): AttemptQuestionState[] {
  return answers.map((answer) => ({
    examQuestionId: answer.examQuestionId,
    selectedOptionId: answer.selectedOptionId,
    isCorrect: answer.isCorrect,
    answeredAt: answer.answeredAt?.toISOString() ?? null,
  }));
}

export async function getActiveExamSet() {
  return getPrismaClient().examSet.findFirst({
    where: {
      isActive: true,
    },
    include: {
      examQuestions: {
        orderBy: {
          position: "asc",
        },
        include: {
          question: {
            include: {
              options: {
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },
      },
    },
  });
}

async function getExamSetForAttempt(examSetId?: string | null) {
  if (!examSetId) {
    return getActiveExamSet();
  }

  return getPrismaClient().examSet.findUnique({
    where: {
      id: examSetId,
    },
    include: {
      examQuestions: {
        orderBy: {
          position: "asc",
        },
        include: {
          question: {
            include: {
              options: {
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function createAttempt(input: {
  examSetId?: string | null;
  examSessionId: string;
  invitationId: string;
  participantName?: string | null;
  participantEmail?: string | null;
  participantPhone?: string | null;
}) {
  const examSet = await getExamSetForAttempt(input.examSetId);

  if (!examSet) {
    throw new Error("Der findes ingen aktiv prove.");
  }

  if (examSet.examQuestions.length === 0) {
    throw new Error("Den aktive prove har ingen sporgsmal.");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + examSet.timeLimitMinutes * 60 * 1000);

  const attempt = await getPrismaClient().$transaction(async (tx) => {
    const createdAttempt = await tx.participantAttempt.create({
      data: {
        examSetId: examSet.id,
        examSessionId: input.examSessionId,
        invitationId: input.invitationId,
        participantName: input.participantName?.trim() || null,
        participantEmail: input.participantEmail?.trim() || null,
        participantPhone: input.participantPhone?.trim() || null,
        startedAt: now,
        expiresAt,
        lastSavedAt: now,
        currentQuestionIndex: 0,
        totalQuestionCount: examSet.examQuestions.length,
      },
    });

    await tx.attemptAnswer.createMany({
      data: examSet.examQuestions.map((examQuestion) => ({
        attemptId: createdAttempt.id,
        examQuestionId: examQuestion.id,
      })),
    });

    return createdAttempt;
  });

  return attempt;
}

async function requireParticipantInvitationId() {
  const session = await getParticipantSession();

  if (!session) {
    throw new Error("Deltagersession mangler eller er udlobet.");
  }

  return session.invitationId;
}

export async function getAttemptSnapshot(
  attemptId: string,
): Promise<AttemptExamSnapshot | null> {
  const invitationId = await requireParticipantInvitationId().catch(() => null);

  if (!invitationId) {
    return null;
  }

  const attempt = await getPrismaClient().participantAttempt.findFirst({
    where: {
      id: attemptId,
      invitationId,
    },
    include: {
      examSet: {
        include: {
          examQuestions: {
            orderBy: {
              position: "asc",
            },
            include: {
              question: {
                include: {
                  options: {
                    orderBy: {
                      sortOrder: "asc",
                    },
                  },
                },
              },
            },
          },
        },
      },
      answers: {
        orderBy: {
          examQuestion: {
            position: "asc",
          },
        },
      },
    },
  });

  if (!attempt) {
    return null;
  }

  return {
    attemptId: attempt.id,
    examTitle: attempt.examSet.title,
    passPercentage: attempt.examSet.passPercentage,
    timeLimitMinutes: attempt.examSet.timeLimitMinutes,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: attempt.expiresAt?.toISOString() ?? attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    currentQuestionIndex: attempt.currentQuestionIndex ?? 0,
    correctAnswerCount: attempt.correctAnswerCount,
    totalQuestionCount: attempt.totalQuestionCount ?? attempt.examSet.examQuestions.length,
    scorePercentage: decimalToNumber(attempt.scorePercentage),
    participantName: attempt.participantName,
    questions: mapQuestions(
      attempt.examSet.examQuestions,
      attempt.status !== AttemptStatus.IN_PROGRESS,
    ),
    answers: mapAnswers(attempt.answers),
  };
}

export async function saveAnswer(input: {
  attemptId: string;
  examQuestionId: string;
  selectedOptionId: string | null;
}) {
  const invitationId = await requireParticipantInvitationId();
  const attempt = await getPrismaClient().participantAttempt.findFirst({
    where: {
      id: input.attemptId,
      invitationId,
    },
    select: {
      status: true,
      expiresAt: true,
      examSetId: true,
    },
  });

  if (!attempt) {
    throw new Error("Forsoget blev ikke fundet eller tilhorer ikke den aktive session.");
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new Error("Forsoget er allerede afleveret.");
  }

  if (attempt.expiresAt && attempt.expiresAt.getTime() <= Date.now()) {
    await submitAttempt(input.attemptId, "AUTO_SUBMITTED");
    throw new Error("Tiden er udlobet, og proven er afleveret automatisk.");
  }

  const validQuestion = await getPrismaClient().examQuestion.findFirst({
    where: {
      id: input.examQuestionId,
      examSetId: attempt.examSetId,
    },
    include: {
      question: {
        include: {
          options: true,
        },
      },
    },
  });

  if (!validQuestion) {
    throw new Error("Sporgsmalet horer ikke til forsoget.");
  }

  if (
    input.selectedOptionId &&
    !validQuestion.question.options.some((option) => option.id === input.selectedOptionId)
  ) {
    throw new Error("Svarmuligheden horer ikke til sporgsmalet.");
  }

  await getPrismaClient().$transaction([
    getPrismaClient().attemptAnswer.upsert({
      where: {
        attemptId_examQuestionId: {
          attemptId: input.attemptId,
          examQuestionId: input.examQuestionId,
        },
      },
      update: {
        selectedOptionId: input.selectedOptionId,
        answeredAt: input.selectedOptionId ? new Date() : null,
      },
      create: {
        attemptId: input.attemptId,
        examQuestionId: input.examQuestionId,
        selectedOptionId: input.selectedOptionId,
        answeredAt: input.selectedOptionId ? new Date() : null,
      },
    }),
    getPrismaClient().participantAttempt.update({
      where: {
        id: input.attemptId,
      },
      data: {
        lastSavedAt: new Date(),
      },
    }),
  ]);
}

export async function updateAttemptProgress(input: {
  attemptId: string;
  currentQuestionIndex: number;
}) {
  const invitationId = await requireParticipantInvitationId();
  const attempt = await getPrismaClient().participantAttempt.findFirst({
    where: {
      id: input.attemptId,
      invitationId,
    },
    select: {
      status: true,
      expiresAt: true,
      totalQuestionCount: true,
      examSet: {
        select: {
          examQuestions: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("Forsoget blev ikke fundet eller tilhorer ikke den aktive session.");
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new Error("Forsoget er ikke laengere aktivt.");
  }

  if (attempt.expiresAt && attempt.expiresAt.getTime() <= Date.now()) {
    await submitAttempt(input.attemptId, "AUTO_SUBMITTED");
    throw new Error("Tiden er udlobet, og proven er afleveret automatisk.");
  }

  const questionCount =
    attempt.totalQuestionCount ?? attempt.examSet.examQuestions.length;
  const maxIndex = Math.max(0, questionCount - 1);
  const nextIndex = Math.max(0, Math.min(maxIndex, Math.trunc(input.currentQuestionIndex)));

  await getPrismaClient().participantAttempt.update({
    where: {
      id: input.attemptId,
    },
    data: {
      currentQuestionIndex: nextIndex,
      lastSavedAt: new Date(),
    },
  });
}

export async function submitAttempt(
  attemptId: string,
  status: "SUBMITTED" | "AUTO_SUBMITTED" = "SUBMITTED",
) {
  const invitationId = await requireParticipantInvitationId();
  const prisma = getPrismaClient();

  const attempt = await prisma.participantAttempt.findFirst({
    where: {
      id: attemptId,
      invitationId,
    },
    include: {
      examSet: {
        include: {
          examQuestions: {
            orderBy: {
              position: "asc",
            },
            include: {
              question: {
                include: {
                  options: true,
                },
              },
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt) {
    throw new Error("Forsoget blev ikke fundet eller tilhorer ikke den aktive session.");
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    return attempt;
  }

  const correctByExamQuestionId = new Map(
    attempt.examSet.examQuestions.map((examQuestion) => [
      examQuestion.id,
      examQuestion.question.options.find((option) => option.isCorrect)?.id ?? null,
    ]),
  );
  const correctAnswerFilters = attempt.answers.flatMap((answer) => {
    const correctOptionId = correctByExamQuestionId.get(answer.examQuestionId) ?? null;

    if (!answer.selectedOptionId || !correctOptionId || answer.selectedOptionId !== correctOptionId) {
      return [];
    }

    return [
      {
        examQuestionId: answer.examQuestionId,
        selectedOptionId: answer.selectedOptionId,
      },
    ];
  });

  const answeredCount = attempt.answers.filter((answer) => answer.selectedOptionId).length;
  const correctAnswerCount = correctAnswerFilters.length;

  const totalQuestionCount = attempt.examSet.examQuestions.length;
  const scorePercentage =
    totalQuestionCount > 0
      ? Number(((correctAnswerCount / totalQuestionCount) * 100).toFixed(2))
      : 0;
  const submittedAt = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.attemptAnswer.updateMany({
      where: {
        attemptId,
      },
      data: {
        isCorrect: false,
      },
    });

    if (correctAnswerFilters.length > 0) {
      await tx.attemptAnswer.updateMany({
        where: {
          attemptId,
          OR: correctAnswerFilters,
        },
        data: {
          isCorrect: true,
        },
      });
    }

    const result = await tx.participantAttempt.updateMany({
      where: {
        id: attemptId,
        invitationId,
        status: AttemptStatus.IN_PROGRESS,
      },
      data: {
        status,
        submittedAt,
        lastSavedAt: submittedAt,
        correctAnswerCount,
        totalQuestionCount,
        scorePercentage: new Prisma.Decimal(scorePercentage),
        currentQuestionIndex: Math.max(0, Math.min(totalQuestionCount - 1, answeredCount)),
      },
    });

    if (attempt.invitationId) {
      await tx.invitation.update({
        where: {
          id: attempt.invitationId,
        },
        data: {
          status: "COMPLETED",
          completedAt: submittedAt,
        },
      });
    }

    const updatedAttempt = await tx.participantAttempt.findFirst({
      where: {
        id: attemptId,
        invitationId,
      },
      include: {
        examSet: {
          include: {
            examQuestions: true,
          },
        },
        answers: true,
      },
    });

    if (!updatedAttempt) {
      throw new Error("Forsoget blev ikke fundet eller tilhorer ikke den aktive session.");
    }

    if (result.count === 0) {
      return updatedAttempt;
    }

    return updatedAttempt;
  });
}

export function isAttemptExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function isAttemptComplete(status: AttemptExamSnapshot["status"]) {
  return status === "SUBMITTED" || status === "AUTO_SUBMITTED" || status === "EXPIRED";
}
