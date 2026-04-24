import { AdminRole, AttemptStatus, Prisma } from "@prisma/client";

import { getPrismaClient } from "@/lib/db/prisma";

type QuestionFormOption = {
  label: string;
  text: string;
};

export type ReportFilters = {
  query?: string;
  outcome?: "all" | "passed" | "failed";
  status?: "all" | "submitted" | "auto_submitted" | "in_progress";
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function createExternalKey(questionText: string) {
  const slug = slugify(questionText) || "sporgsmaal";
  return `${slug}-${Date.now()}`;
}

export async function getActiveExamAdminSnapshot() {
  const prisma = getPrismaClient();

  const examSet = await prisma.examSet.findFirst({
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
          answers: {
            select: {
              id: true,
            },
          },
        },
      },
      attempts: {
        orderBy: {
          startedAt: "desc",
        },
      },
    },
  });

  if (!examSet) {
    return null;
  }

  const completedAttempts = examSet.attempts.filter(
    (attempt) =>
      attempt.status === AttemptStatus.SUBMITTED ||
      attempt.status === AttemptStatus.AUTO_SUBMITTED,
  );
  const scoredAttempts = completedAttempts.filter(
    (attempt) => typeof attempt.scorePercentage?.toNumber() === "number",
  );
  const passedAttempts = completedAttempts.filter(
    (attempt) =>
      Number(attempt.scorePercentage?.toString() ?? 0) >= examSet.passPercentage,
  );

  const averageScore =
    scoredAttempts.length > 0
      ? Number(
          (
            scoredAttempts.reduce(
              (sum, attempt) => sum + Number(attempt.scorePercentage?.toString() ?? 0),
              0,
            ) / scoredAttempts.length
          ).toFixed(1),
        )
      : null;

  return {
    examSet: {
      id: examSet.id,
      title: examSet.title,
      version: examSet.version,
      timeLimitMinutes: examSet.timeLimitMinutes,
      passPercentage: examSet.passPercentage,
      questionCount: examSet.examQuestions.length,
      hasAttempts: examSet.attempts.length > 0,
    },
    questions: examSet.examQuestions.map((examQuestion) => ({
      examQuestionId: examQuestion.id,
      position: examQuestion.position,
      answerCount: examQuestion.answers.length,
      question: {
        id: examQuestion.question.id,
        externalKey: examQuestion.question.externalKey,
        category: examQuestion.question.category,
        questionText: examQuestion.question.questionText,
        explanation: examQuestion.question.explanation,
        options: examQuestion.question.options.map((option) => ({
          id: option.id,
          label: option.label,
          text: option.optionText,
          isCorrect: option.isCorrect,
        })),
      },
    })),
    recentAttempts: examSet.attempts.slice(0, 8).map((attempt) => ({
      id: attempt.id,
      participantName: attempt.participantName,
      participantEmail: attempt.participantEmail,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      scorePercentage: attempt.scorePercentage
        ? Number(attempt.scorePercentage.toString())
        : null,
    })),
    stats: {
      totalAttempts: examSet.attempts.length,
      completedAttempts: completedAttempts.length,
      passedAttempts: passedAttempts.length,
      averageScore,
    },
  };
}

export async function getAdminDashboardSnapshot() {
  const [examSnapshot, reportSnapshot, auditLogSnapshot] = await Promise.all([
    getActiveExamAdminSnapshot(),
    getAdminReportsSnapshot(),
    getAdminAuditSnapshot(),
  ]);

  if (!examSnapshot || !reportSnapshot) {
    return null;
  }

  const invitationSnapshot = await getPrismaClient().invitation.groupBy({
    by: ["status"],
    where: {
      examSetId: examSnapshot.examSet.id,
    },
    _count: {
      _all: true,
    },
  });

  const invitationCounts = invitationSnapshot.reduce<Record<string, number>>((result, entry) => {
    result[entry.status] = entry._count._all;
    return result;
  }, {});

  return {
    exam: examSnapshot.examSet,
    stats: examSnapshot.stats,
    reportStats: reportSnapshot.stats,
    recentAttempts: examSnapshot.recentAttempts,
    invitationStats: {
      total:
        (invitationCounts.CREATED ?? 0) +
        (invitationCounts.SENT ?? 0) +
        (invitationCounts.OPENED ?? 0) +
        (invitationCounts.COMPLETED ?? 0) +
        (invitationCounts.EXPIRED ?? 0),
      created: invitationCounts.CREATED ?? 0,
      sent: invitationCounts.SENT ?? 0,
      opened: invitationCounts.OPENED ?? 0,
      completed: invitationCounts.COMPLETED ?? 0,
      expired: invitationCounts.EXPIRED ?? 0,
    },
    hardestQuestions: reportSnapshot.hardestQuestions.slice(0, 3),
    recentAdminActivity: auditLogSnapshot,
  };
}

export async function getAdminAuditSnapshot() {
  const auditLogs = await getPrismaClient().adminAuditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
    include: {
      adminUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return auditLogs.map((log: (typeof auditLogs)[number]) => ({
    id: log.id,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    targetLabel: log.targetLabel,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt,
    adminUser: log.adminUser,
  }));
}

export async function getAdminUsersSnapshot() {
  const prisma = getPrismaClient();
  const adminUsers = await prisma.adminUser.findMany({
    orderBy: [
      {
        role: "asc",
      },
      {
        email: "asc",
      },
    ],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastMagicLinkSentAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          createdInvites: true,
          createdExams: true,
        },
      },
    },
  });

  const superAdminEmail = (
    process.env.SUPER_ADMIN_EMAIL ??
    process.env.ADMIN_LOGIN_EMAIL ??
    ""
  )
    .trim()
    .toLowerCase();

  return {
    users: adminUsers.map((user) => ({
      ...user,
      isBootstrapSuperAdmin: user.email.toLowerCase() === superAdminEmail,
    })),
    roleOptions: [
      { value: AdminRole.EDITOR, label: "Admin" },
      { value: AdminRole.SUPER_ADMIN, label: "Superadmin" },
    ],
  };
}

function normaliseReportFilters(filters?: ReportFilters) {
  return {
    query: filters?.query?.trim() ?? "",
    outcome: filters?.outcome ?? "all",
    status: filters?.status ?? "all",
  };
}

function buildAttemptWhereClause(examSetId: string, filters: ReturnType<typeof normaliseReportFilters>) {
  const where: Prisma.ParticipantAttemptWhereInput = {
    examSetId,
  };

  if (filters.query) {
    where.OR = [
      {
        participantName: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
      {
        participantEmail: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
      {
        participantPhone: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
    ];
  }

  if (filters.status === "submitted") {
    where.status = AttemptStatus.SUBMITTED;
  } else if (filters.status === "auto_submitted") {
    where.status = AttemptStatus.AUTO_SUBMITTED;
  } else if (filters.status === "in_progress") {
    where.status = AttemptStatus.IN_PROGRESS;
  }

  return where;
}

function toScoreNumber(value: { toString(): string } | null | undefined) {
  return value ? Number(value.toString()) : null;
}

export async function getAdminReportsSnapshot(filters?: ReportFilters) {
  const prisma = getPrismaClient();
  const examSet = await prisma.examSet.findFirst({
    where: {
      isActive: true,
    },
    include: {
      examQuestions: {
        include: {
          question: {
            select: {
              questionText: true,
            },
          },
        },
      },
      attempts: {
        orderBy: {
          startedAt: "desc",
        },
      },
    },
  });

  if (!examSet) {
    return null;
  }

  const normalisedFilters = normaliseReportFilters(filters);
  const filteredAttempts = await prisma.participantAttempt.findMany({
    where: buildAttemptWhereClause(examSet.id, normalisedFilters),
    orderBy: {
      startedAt: "desc",
    },
    include: {
      invitation: {
        select: {
          channel: true,
        },
      },
      answers: {
        where: {
          isCorrect: false,
          selectedOptionId: {
            not: null,
          },
        },
        select: {
          examQuestionId: true,
        },
      },
    },
  });

  const completedAttempts = filteredAttempts.filter(
    (attempt) =>
      attempt.status === AttemptStatus.SUBMITTED ||
      attempt.status === AttemptStatus.AUTO_SUBMITTED,
  );
  const attemptsWithOutcome = completedAttempts.map((attempt) => ({
    ...attempt,
    scoreNumber: toScoreNumber(attempt.scorePercentage),
  }));
  const passedAttempts = attemptsWithOutcome.filter(
    (attempt) => (attempt.scoreNumber ?? 0) >= examSet.passPercentage,
  );
  const outcomeFilteredAttempts =
    normalisedFilters.outcome === "passed"
      ? attemptsWithOutcome.filter((attempt) => (attempt.scoreNumber ?? 0) >= examSet.passPercentage)
      : normalisedFilters.outcome === "failed"
        ? attemptsWithOutcome.filter((attempt) => (attempt.scoreNumber ?? 0) < examSet.passPercentage)
        : filteredAttempts;
  const averageScore =
    attemptsWithOutcome.length > 0
      ? Number(
          (
            attemptsWithOutcome.reduce(
              (sum, attempt) => sum + (attempt.scoreNumber ?? 0),
              0,
            ) / attemptsWithOutcome.length
          ).toFixed(1),
        )
      : null;
  const finalAttempts =
    normalisedFilters.outcome === "all" ? filteredAttempts : outcomeFilteredAttempts;
  const failedAnswerCounts = new Map<string, number>();

  completedAttempts.forEach((attempt) => {
    attempt.answers.forEach((answer) => {
      failedAnswerCounts.set(
        answer.examQuestionId,
        (failedAnswerCounts.get(answer.examQuestionId) ?? 0) + 1,
      );
    });
  });

  const hardestQuestions = examSet.examQuestions
    .map((examQuestion) => ({
      examQuestionId: examQuestion.id,
      position: examQuestion.position,
      questionText: examQuestion.question.questionText,
      incorrectCount: failedAnswerCounts.get(examQuestion.id) ?? 0,
      totalCompletedAttempts: completedAttempts.length,
      incorrectRate:
        completedAttempts.length > 0
          ? Number(
              (
                ((failedAnswerCounts.get(examQuestion.id) ?? 0) / completedAttempts.length) *
                100
              ).toFixed(1),
            )
          : 0,
    }))
    .sort((left, right) => {
      if (right.incorrectCount !== left.incorrectCount) {
        return right.incorrectCount - left.incorrectCount;
      }

      return left.position - right.position;
    })
    .slice(0, 5);
  const passRate =
    attemptsWithOutcome.length > 0
      ? Number(((passedAttempts.length / attemptsWithOutcome.length) * 100).toFixed(1))
      : null;

  return {
    examSet: {
      title: examSet.title,
      passPercentage: examSet.passPercentage,
      timeLimitMinutes: examSet.timeLimitMinutes,
      questionCount: examSet.examQuestions.length,
    },
    attempts: finalAttempts.map((attempt) => {
      const scoreNumber = toScoreNumber(attempt.scorePercentage);

      return {
      id: attempt.id,
      participantName: attempt.participantName,
      participantEmail: attempt.participantEmail,
      participantPhone: attempt.participantPhone,
      status: attempt.status,
      correctAnswerCount: attempt.correctAnswerCount,
      totalQuestionCount: attempt.totalQuestionCount,
      scorePercentage: scoreNumber,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      updatedAt: attempt.updatedAt,
      passed:
        scoreNumber !== null
          ? scoreNumber >= examSet.passPercentage
          : null,
      invitationChannel: attempt.invitation?.channel ?? null,
    };
    }),
    stats: {
      totalAttempts: filteredAttempts.length,
      completedAttempts: completedAttempts.length,
      passedAttempts: passedAttempts.length,
      failedAttempts: completedAttempts.length - passedAttempts.length,
      inProgressAttempts: filteredAttempts.filter(
        (attempt) => attempt.status === AttemptStatus.IN_PROGRESS,
      ).length,
      autoSubmittedAttempts: filteredAttempts.filter(
        (attempt) => attempt.status === AttemptStatus.AUTO_SUBMITTED,
      ).length,
      averageScore,
      passRate,
    },
    hardestQuestions,
    filters: normalisedFilters,
    exportFields: [
      "attemptId",
      "participantName",
      "participantEmail",
      "participantPhone",
      "invitationChannel",
      "status",
      "scorePercentage",
      "passed",
      "correctAnswerCount",
      "totalQuestionCount",
      "startedAt",
      "submittedAt",
    ],
  };
}

function escapeCsvValue(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export async function buildAdminReportsCsv(filters?: ReportFilters) {
  const snapshot = await getAdminReportsSnapshot(filters);

  if (!snapshot) {
    return null;
  }

  const headers = snapshot.exportFields;
  const lines = [
    headers.join(","),
    ...snapshot.attempts.map((attempt) =>
      [
        attempt.id,
        attempt.participantName ?? "",
        attempt.participantEmail ?? "",
        attempt.participantPhone ?? "",
        attempt.invitationChannel ?? "",
        attempt.status,
        attempt.scorePercentage?.toString() ?? "",
        attempt.passed === null ? "" : attempt.passed ? "ja" : "nej",
        attempt.correctAnswerCount?.toString() ?? "",
        attempt.totalQuestionCount?.toString() ?? "",
        attempt.startedAt.toISOString(),
        attempt.submittedAt?.toISOString() ?? "",
      ]
        .map((value) => escapeCsvValue(String(value)))
        .join(","),
    ),
  ];

  return lines.join("\n");
}

export function getQuestionFormDefaults() {
  return {
    externalKey: "",
    category: "",
    questionText: "",
    explanation: "",
    options: [
      { label: "A", text: "" },
      { label: "B", text: "" },
      { label: "C", text: "" },
      { label: "D", text: "" },
    ],
    correctOptionLabel: "A",
  };
}

export function buildQuestionFormState(question: {
  externalKey: string;
  category: string | null;
  questionText: string;
  explanation: string | null;
  options: Array<{ label: string; text: string; isCorrect: boolean }>;
}) {
  const paddedOptions = [...question.options];

  while (paddedOptions.length < 4) {
    const nextLabel = String.fromCharCode(65 + paddedOptions.length);
    paddedOptions.push({
      label: nextLabel,
      text: "",
      isCorrect: false,
    });
  }

  return {
    externalKey: question.externalKey,
    category: question.category ?? "",
    questionText: question.questionText,
    explanation: question.explanation ?? "",
    options: paddedOptions.map((option) => ({
      label: option.label,
      text: option.text,
    })),
    correctOptionLabel:
      question.options.find((option) => option.isCorrect)?.label ?? paddedOptions[0]?.label ?? "A",
  };
}

export function parseQuestionFormData(formData: FormData) {
  const rawLabels = formData.getAll("optionLabel").map((value) => String(value).trim());
  const rawTexts = formData.getAll("optionText").map((value) => String(value).trim());
  const options: QuestionFormOption[] = rawLabels.flatMap((label, index) => {
    const text = rawTexts[index] ?? "";

    if (!label && !text) {
      return [];
    }

    return [
      {
        label: label.toUpperCase(),
        text,
      },
    ];
  });

  const correctOptionLabel = String(formData.get("correctOptionLabel") ?? "")
    .trim()
    .toUpperCase();

  if (!String(formData.get("questionText") ?? "").trim()) {
    throw new Error("Spørgsmålet må ikke være tomt.");
  }

  if (options.length < 2) {
    throw new Error("Der skal være mindst to svarmuligheder.");
  }

  if (new Set(options.map((option) => option.label)).size !== options.length) {
    throw new Error("Svarlabels skal være unikke.");
  }

  if (options.some((option) => !option.text)) {
    throw new Error("Alle udfyldte svarmuligheder skal have tekst.");
  }

  if (!options.some((option) => option.label === correctOptionLabel)) {
    throw new Error("Vælg præcis ét korrekt svar.");
  }

  return {
    externalKey:
      String(formData.get("externalKey") ?? "").trim() ||
      createExternalKey(String(formData.get("questionText") ?? "")),
    category: String(formData.get("category") ?? "").trim() || null,
    questionText: String(formData.get("questionText") ?? "").trim(),
    explanation: String(formData.get("explanation") ?? "").trim() || null,
    options,
    correctOptionLabel,
  };
}

export async function ensureEditableExamSet() {
  const prisma = getPrismaClient();
  const examSet = await prisma.examSet.findFirst({
    where: {
      isActive: true,
    },
    include: {
      attempts: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!examSet) {
    throw new Error("Der findes ingen aktiv prøve.");
  }

  if (examSet.attempts.length > 0) {
    throw new Error(
      "Spørgsmål kan ikke ændres, når den aktive prøve allerede har deltagerforsøg.",
    );
  }

  return examSet;
}

export async function resequenceExamQuestions(examSetId: string) {
  const prisma = getPrismaClient();
  const examQuestions = await prisma.examQuestion.findMany({
    where: {
      examSetId,
    },
    orderBy: {
      position: "asc",
    },
  });

  await prisma.$transaction(
    examQuestions.map((examQuestion, index) =>
      prisma.examQuestion.update({
        where: {
          id: examQuestion.id,
        },
        data: {
          position: index + 1,
        },
      }),
    ),
  );
}
