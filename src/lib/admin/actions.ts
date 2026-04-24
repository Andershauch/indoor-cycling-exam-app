"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminRole, InvitationChannel } from "@prisma/client";

import { createAdminAuditLog, getAdminRequestContext } from "@/lib/admin/audit";
import {
  clearAdminSession,
  isAdminLoginConfigured,
  issueAdminMagicLink,
  requireAdminSession,
} from "@/lib/admin/auth";
import {
  ensureEditableExamSet,
  parseQuestionFormData,
  resequenceExamQuestions,
} from "@/lib/admin/data";
import { parseParticipantBatchFile } from "@/lib/admin/participant-batch-import";
import { getPrismaClient } from "@/lib/db/prisma";
import { createAndDispatchInvitation } from "@/lib/invitations/service";

const ADMINS_ROUTE = "/admins" as Parameters<typeof redirect>[0];

async function logAdminAction(input: {
  adminUserId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const requestContext = await getAdminRequestContext();

  await createAdminAuditLog({
    adminUserId: input.adminUserId ?? null,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    targetLabel: input.targetLabel ?? null,
    metadata: input.metadata ?? null,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
  });
}

export async function loginAdminAction(formData: FormData) {
  if (!isAdminLoginConfigured()) {
    redirect("/admin/login?error=config");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/admin/login?error=email");
  }

  try {
    await issueAdminMagicLink(email);
  } catch (error) {
    if (error instanceof Error && error.message.includes("For mange admin-loginforsog")) {
      redirect("/admin/login?error=rate-limit");
    }

    throw error;
  }

  redirect("/admin/login?sent=1");
}

export async function logoutAdminAction() {
  const session = await requireAdminSession();
  await logAdminAction({
    adminUserId: session.id,
    action: "ADMIN_LOGOUT",
    targetType: "admin_user",
    targetId: session.id,
    targetLabel: session.email,
  });
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createAdminUserAction(formData: FormData) {
  const session = await requireAdminSession(AdminRole.SUPER_ADMIN);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const roleValue = String(formData.get("role") ?? "").trim().toUpperCase();

  if (!email) {
    throw new Error("Admin-e-mail mangler.");
  }

  if (roleValue !== AdminRole.EDITOR && roleValue !== AdminRole.SUPER_ADMIN) {
    throw new Error("Vælg en gyldig admin-rolle.");
  }

  const bootstrapSuperAdminEmail = (
    process.env.SUPER_ADMIN_EMAIL ??
    process.env.ADMIN_LOGIN_EMAIL ??
    ""
  )
    .trim()
    .toLowerCase();

  if (email === bootstrapSuperAdminEmail && roleValue !== AdminRole.SUPER_ADMIN) {
    throw new Error("Bootstrap-superadmin skal oprettes som superadmin.");
  }

  const prisma = getPrismaClient();
  await prisma.adminUser.upsert({
    where: {
      email,
    },
    update: {
      name: name || undefined,
      role: roleValue,
      isActive: true,
    },
    create: {
      email,
      name: name || email.split("@")[0] || "Admin",
      role: roleValue,
      isActive: true,
    },
  });

  const targetUser = await prisma.adminUser.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  await logAdminAction({
    adminUserId: session.id,
    action: "ADMIN_USER_UPSERTED",
    targetType: "admin_user",
    targetId: targetUser?.id ?? null,
    targetLabel: email,
    metadata: {
      role: targetUser?.role ?? roleValue,
      bootstrapProtected: email === bootstrapSuperAdminEmail,
    },
  });

  revalidatePath(ADMINS_ROUTE);
  redirect(ADMINS_ROUTE);
}

export async function updateAdminUserRoleAction(formData: FormData) {
  const session = await requireAdminSession(AdminRole.SUPER_ADMIN);
  const adminUserId = String(formData.get("adminUserId") ?? "").trim();
  const roleValue = String(formData.get("role") ?? "").trim().toUpperCase();

  if (!adminUserId) {
    throw new Error("adminUserId mangler.");
  }

  if (roleValue !== AdminRole.EDITOR && roleValue !== AdminRole.SUPER_ADMIN) {
    throw new Error("Vælg en gyldig admin-rolle.");
  }

  const prisma = getPrismaClient();
  const target = await prisma.adminUser.findUnique({
    where: {
      id: adminUserId,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!target) {
    throw new Error("Admin-brugeren blev ikke fundet.");
  }

  const bootstrapSuperAdminEmail = (
    process.env.SUPER_ADMIN_EMAIL ??
    process.env.ADMIN_LOGIN_EMAIL ??
    ""
  )
    .trim()
    .toLowerCase();

  if (target.email.toLowerCase() === bootstrapSuperAdminEmail && roleValue !== AdminRole.SUPER_ADMIN) {
    throw new Error("Bootstrap-superadmin kan ikke nedgraderes.");
  }

  await prisma.adminUser.update({
    where: {
      id: adminUserId,
    },
    data: {
      role: roleValue,
    },
  });

  await logAdminAction({
    adminUserId: session.id,
    action: "ADMIN_USER_ROLE_UPDATED",
    targetType: "admin_user",
    targetId: target.id,
    targetLabel: target.email,
    metadata: {
      role: roleValue,
    },
  });

  revalidatePath(ADMINS_ROUTE);

  if (session.id === adminUserId) {
    redirect(ADMINS_ROUTE);
  }

  redirect(ADMINS_ROUTE);
}

export async function toggleAdminUserActiveAction(formData: FormData) {
  const session = await requireAdminSession(AdminRole.SUPER_ADMIN);
  const adminUserId = String(formData.get("adminUserId") ?? "").trim();
  const nextActive = String(formData.get("nextActive") ?? "").trim() === "true";

  if (!adminUserId) {
    throw new Error("adminUserId mangler.");
  }

  const prisma = getPrismaClient();
  const target = await prisma.adminUser.findUnique({
    where: {
      id: adminUserId,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!target) {
    throw new Error("Admin-brugeren blev ikke fundet.");
  }

  const bootstrapSuperAdminEmail = (
    process.env.SUPER_ADMIN_EMAIL ??
    process.env.ADMIN_LOGIN_EMAIL ??
    ""
  )
    .trim()
    .toLowerCase();

  if (target.email.toLowerCase() === bootstrapSuperAdminEmail && !nextActive) {
    throw new Error("Bootstrap-superadmin kan ikke deaktiveres.");
  }

  await prisma.adminUser.update({
    where: {
      id: adminUserId,
    },
    data: {
      isActive: nextActive,
    },
  });

  await logAdminAction({
    adminUserId: session.id,
    action: nextActive ? "ADMIN_USER_ACTIVATED" : "ADMIN_USER_DEACTIVATED",
    targetType: "admin_user",
    targetId: target.id,
    targetLabel: target.email,
  });

  revalidatePath(ADMINS_ROUTE);

  if (session.id === adminUserId && !nextActive) {
    await clearAdminSession();
    redirect("/admin/login");
  }

  redirect(ADMINS_ROUTE);
}

export async function createQuestionAction(formData: FormData) {
  const session = await requireAdminSession(AdminRole.SUPER_ADMIN);

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

  await logAdminAction({
    adminUserId: session.id,
    action: "QUESTION_CREATED",
    targetType: "exam_set",
    targetId: examSet.id,
    targetLabel: payload.externalKey,
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateQuestionAction(formData: FormData) {
  const session = await requireAdminSession(AdminRole.SUPER_ADMIN);

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

  await logAdminAction({
    adminUserId: session.id,
    action: "QUESTION_UPDATED",
    targetType: "question",
    targetId: questionId,
    targetLabel: payload.externalKey,
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteQuestionAction(formData: FormData) {
  const session = await requireAdminSession(AdminRole.SUPER_ADMIN);

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
    select: {
      id: true,
      question: {
        select: {
          id: true,
          externalKey: true,
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
  await logAdminAction({
    adminUserId: session.id,
    action: "QUESTION_DELETED",
    targetType: "question",
    targetId: examQuestion.question.id,
    targetLabel: examQuestion.question.externalKey,
  });
  revalidatePath("/admin");
  redirect("/admin");
}

export async function moveQuestionAction(formData: FormData) {
  const session = await requireAdminSession(AdminRole.SUPER_ADMIN);

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

  await logAdminAction({
    adminUserId: session.id,
    action: "QUESTION_REORDERED",
    targetType: "question",
    targetId: current.id,
    metadata: {
      direction,
      fromPosition: current.position,
      toPosition: target.position,
    },
  });

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

  await logAdminAction({
    adminUserId: session.id,
    action: "INVITATION_CREATED",
    targetType: "exam_set",
    targetId: examSet.id,
    targetLabel: String(formData.get("recipientEmail") ?? "").trim() || String(formData.get("recipientPhone") ?? "").trim() || "invitation",
    metadata: {
      channel: channelValue,
    },
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

    await logAdminAction({
      adminUserId: session.id,
      action: "INVITATION_BATCH_PROCESSED",
      targetType: "exam_set",
      targetId: examSet.id,
      targetLabel: upload.name,
      metadata: {
        createdCount,
        failedCount,
        ignoredCount: parsed.ignoredRowCount,
      },
    });

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
