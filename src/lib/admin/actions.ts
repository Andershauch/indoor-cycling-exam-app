"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearAdminSession,
  createAdminSession,
  getAdminLoginConfig,
  isAdminLoginConfigured,
  requireAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin/auth";
import {
  ensureEditableExamSet,
  parseQuestionFormData,
  resequenceExamQuestions,
} from "@/lib/admin/data";
import { parseParticipantBatchFile } from "@/lib/admin/participant-batch-import";
import { getPrismaClient } from "@/lib/db/prisma";
import { InvitationChannel } from "@prisma/client";
import { createAndDispatchInvitation } from "@/lib/invitations/service";

export async function loginAdminAction(formData: FormData) {
  if (!isAdminLoginConfigured()) {
    redirect("/admin/login?error=config");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const config = getAdminLoginConfig();

  if (!verifyAdminCredentials(email, password)) {
    redirect("/admin/login?error=credentials");
  }

  await createAdminSession(config.email);

  const prisma = getPrismaClient();
  await prisma.adminUser.upsert({
    where: {
      email: config.email,
    },
    update: {
      name: config.name,
      isActive: true,
    },
    create: {
      email: config.email,
      name: config.name,
    },
  });

  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createQuestionAction(formData: FormData) {
  await requireAdminSession();

  const prisma = getPrismaClient();
  const examSet = await ensureEditableExamSet();
  const payload = parseQuestionFormData(formData);
  const lastQuestion = await prisma.examQuestion.findFirst({
    where: {
      examSetId: examSet.id,
    },
    orderBy: {
      position: "desc",
    },
  });

  await prisma.$transaction(async (tx) => {
    const question = await tx.question.create({
      data: {
        externalKey: payload.externalKey,
        category: payload.category,
        questionText: payload.questionText,
        explanation: payload.explanation,
        options: {
          create: payload.options.map((option, index) => ({
            label: option.label,
            optionText: option.text,
            sortOrder: index + 1,
            isCorrect: option.label === payload.correctOptionLabel,
          })),
        },
      },
    });

    await tx.examQuestion.create({
      data: {
        examSetId: examSet.id,
        questionId: question.id,
        position: (lastQuestion?.position ?? 0) + 1,
      },
    });
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateQuestionAction(formData: FormData) {
  await requireAdminSession();

  const prisma = getPrismaClient();
  await ensureEditableExamSet();
  const payload = parseQuestionFormData(formData);
  const questionId = String(formData.get("questionId") ?? "").trim();

  if (!questionId) {
    throw new Error("questionId mangler.");
  }

  const existingQuestion = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: {
      options: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!existingQuestion) {
    throw new Error("Spørgsmålet blev ikke fundet.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.question.update({
      where: {
        id: questionId,
      },
      data: {
        externalKey: payload.externalKey,
        category: payload.category,
        questionText: payload.questionText,
        explanation: payload.explanation,
      },
    });

    await Promise.all(
      payload.options.map((option, index) => {
        const existingOption = existingQuestion.options[index];

        if (existingOption) {
          return tx.answerOption.update({
            where: {
              id: existingOption.id,
            },
            data: {
              label: option.label,
              optionText: option.text,
              sortOrder: index + 1,
              isCorrect: option.label === payload.correctOptionLabel,
            },
          });
        }

        return tx.answerOption.create({
          data: {
            questionId,
            label: option.label,
            optionText: option.text,
            sortOrder: index + 1,
            isCorrect: option.label === payload.correctOptionLabel,
          },
        });
      }),
    );

    const extraOptions = existingQuestion.options.slice(payload.options.length);

    if (extraOptions.length > 0) {
      await tx.answerOption.deleteMany({
        where: {
          id: {
            in: extraOptions.map((option) => option.id),
          },
        },
      });
    }
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteQuestionAction(formData: FormData) {
  await requireAdminSession();

  const prisma = getPrismaClient();
  const examSet = await ensureEditableExamSet();
  const examQuestionId = String(formData.get("examQuestionId") ?? "").trim();

  if (!examQuestionId) {
    throw new Error("examQuestionId mangler.");
  }

  const examQuestion = await prisma.examQuestion.findUnique({
    where: {
      id: examQuestionId,
    },
    include: {
      question: {
        include: {
          examEntries: true,
        },
      },
    },
  });

  if (!examQuestion) {
    throw new Error("Spørgsmålet blev ikke fundet.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.examQuestion.delete({
      where: {
        id: examQuestionId,
      },
    });

    if (examQuestion.question.examEntries.length <= 1) {
      await tx.answerOption.deleteMany({
        where: {
          questionId: examQuestion.question.id,
        },
      });

      await tx.question.delete({
        where: {
          id: examQuestion.question.id,
        },
      });
    }
  });

  await resequenceExamQuestions(examSet.id);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function moveQuestionAction(formData: FormData) {
  await requireAdminSession();

  const prisma = getPrismaClient();
  const examSet = await ensureEditableExamSet();
  const examQuestionId = String(formData.get("examQuestionId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "").trim();

  if (!examQuestionId || !["up", "down"].includes(direction)) {
    throw new Error("Ugyldig flyttehandling.");
  }

  const examQuestions = await prisma.examQuestion.findMany({
    where: {
      examSetId: examSet.id,
    },
    orderBy: {
      position: "asc",
    },
  });

  const currentIndex = examQuestions.findIndex(
    (examQuestion) => examQuestion.id === examQuestionId,
  );

  if (currentIndex === -1) {
    throw new Error("Spørgsmålet blev ikke fundet.");
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= examQuestions.length) {
    redirect("/admin");
  }

  const current = examQuestions[currentIndex];
  const target = examQuestions[targetIndex];

  await prisma.$transaction([
    prisma.examQuestion.update({
      where: {
        id: current.id,
      },
      data: {
        position: target.position,
      },
    }),
    prisma.examQuestion.update({
      where: {
        id: target.id,
      },
      data: {
        position: current.position,
      },
    }),
  ]);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function createInvitationAction(formData: FormData) {
  const session = await requireAdminSession();
  const prisma = getPrismaClient();
  const examSet = await prisma.examSet.findFirst({
    where: {
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!examSet) {
    throw new Error("Der findes ingen aktiv prøve.");
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: {
      email: session.email,
    },
    select: {
      id: true,
    },
  });

  const channelValue = String(formData.get("channel") ?? "").trim().toUpperCase();

  if (channelValue !== InvitationChannel.EMAIL && channelValue !== InvitationChannel.SMS) {
    throw new Error("Vælg en gyldig kanal.");
  }

  await createAndDispatchInvitation({
    examSetId: examSet.id,
    createdByAdminId: adminUser?.id ?? null,
    channel: channelValue,
    recipientName: String(formData.get("recipientName") ?? "").trim() || null,
    recipientEmail: String(formData.get("recipientEmail") ?? "").trim() || null,
    recipientPhone: String(formData.get("recipientPhone") ?? "").trim() || null,
  });

  revalidatePath("/invitations");
  redirect("/invitations");
}

export async function createBatchInvitationsAction(formData: FormData) {
  const session = await requireAdminSession();
  const prisma = getPrismaClient();
  const examSet = await prisma.examSet.findFirst({
    where: {
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!examSet) {
    redirect(`/invitations?${new URLSearchParams({ batchError: "Ingen aktiv prøve" }).toString()}`);
  }

  const upload = formData.get("batchFile");

  if (!(upload instanceof File) || upload.size === 0) {
    redirect(`/invitations?${new URLSearchParams({ batchError: "Vælg en Excel-fil" }).toString()}`);
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: {
      email: session.email,
    },
    select: {
      id: true,
    },
  });

  try {
    const parsed = await parseParticipantBatchFile(upload);

    if (parsed.entries.length === 0) {
      redirect(
        `/invitations?${new URLSearchParams({ batchError: "Ingen gyldige deltagere fundet i filen" }).toString()}`,
      );
    }

    let createdCount = 0;
    let failedCount = 0;

    for (const participant of parsed.entries) {
      try {
        await createAndDispatchInvitation({
          examSetId: examSet.id,
          createdByAdminId: adminUser?.id ?? null,
          channel: InvitationChannel.EMAIL,
          recipientName: participant.name,
          recipientEmail: participant.email,
          recipientPhone: null,
        });
        createdCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    revalidatePath("/admin");
    revalidatePath("/invitations");
    redirect(`/invitations?${new URLSearchParams({
      batchOk: "1",
      created: String(createdCount),
      failed: String(failedCount),
      ignored: String(parsed.ignoredRowCount),
    }).toString()}`);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Excel-filen kunne ikke behandles";

    redirect(`/invitations?${new URLSearchParams({ batchError: message }).toString()}`);
  }
}
