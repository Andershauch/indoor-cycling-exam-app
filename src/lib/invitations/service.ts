import {
  InvitationChannel,
  InvitationStatus,
  AttemptStatus,
} from "@prisma/client";

import { getAppEnv } from "@/lib/config/app-env";
import { getPrismaClient } from "@/lib/db/prisma";
import { createAttempt } from "@/lib/exam/service";
import { sendInvitationEmail } from "@/lib/invitations/email-service";
import { sendInvitationSms } from "@/lib/invitations/sms-service";
import { generateInvitationToken } from "@/lib/invitations/token";
import {
  clearParticipantSession,
  createParticipantSession,
  doesParticipantSessionMatchInvitation,
  generateParticipantSessionNonce,
  getParticipantSessionDurationMs,
  hashParticipantSessionNonce,
} from "@/lib/participant/auth";
import type {
  InvitationDispatchPayload,
  InvitationDispatchResult,
} from "@/lib/invitations/types";

function getInvitationLink(token: string) {
  return `${getAppEnv().appUrl}/invite/${token}`;
}

function getExpiryDate() {
  const hours = Number(process.env.INVITATION_EXPIRES_HOURS ?? 72);
  return new Date(Date.now() + Math.max(1, hours) * 60 * 60 * 1000);
}

async function dispatchInvitation(
  channel: InvitationChannel,
  payload: InvitationDispatchPayload,
): Promise<InvitationDispatchResult> {
  if (channel === InvitationChannel.EMAIL) {
    return sendInvitationEmail(payload);
  }

  return sendInvitationSms(payload);
}

function getParticipantSessionExpiryDate() {
  return new Date(Date.now() + getParticipantSessionDurationMs());
}

async function createFreshParticipantSession(invitationId: string) {
  const nonce = generateParticipantSessionNonce();
  const expiresAt = getParticipantSessionExpiryDate();

  await createParticipantSession({
    invitationId,
    nonce,
    expiresAt,
  });

  return {
    nonceHash: hashParticipantSessionNonce(nonce),
    expiresAt,
  };
}

export async function createAndDispatchInvitation(input: {
  examSetId: string;
  examSessionId: string;
  createdByAdminId?: string | null;
  channel: InvitationChannel;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
}) {
  const prisma = getPrismaClient();
  const examSet = (
    await prisma.examSession.findUnique({
      where: {
        id: input.examSessionId,
      },
      select: {
        id: true,
        examSet: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })
  )?.examSet;

  if (!examSet) {
    throw new Error("Prøveformatet for invitationen blev ikke fundet.");
  }

  if (examSet.id !== input.examSetId) {
    throw new Error("Prøveafholdelsen matcher ikke det valgte prøveformat.");
  }

  if (input.channel === InvitationChannel.EMAIL && !input.recipientEmail?.trim()) {
    throw new Error("E-mail skal udfyldes ved e-mailinvitation.");
  }

  if (input.channel === InvitationChannel.SMS && !input.recipientPhone?.trim()) {
    throw new Error("Telefon skal udfyldes ved sms-invitation.");
  }

  const invitation = await prisma.invitation.create({
    data: {
      examSetId: examSet.id,
      examSessionId: input.examSessionId,
      createdByAdminId: input.createdByAdminId ?? null,
      channel: input.channel,
      status: InvitationStatus.CREATED,
      token: generateInvitationToken(),
      recipientName: input.recipientName?.trim() || null,
      recipientEmail: input.recipientEmail?.trim() || null,
      recipientPhone: input.recipientPhone?.trim() || null,
      expiresAt: getExpiryDate(),
    },
  });

  const dispatchResult = await dispatchInvitation(input.channel, {
    recipientName: invitation.recipientName,
    recipientEmail: invitation.recipientEmail,
    recipientPhone: invitation.recipientPhone,
    invitationLink: getInvitationLink(invitation.token),
    examTitle: examSet.title,
  });

  const updatedInvitation = await prisma.invitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      status: dispatchResult.delivered ? InvitationStatus.SENT : InvitationStatus.CREATED,
      sentAt: dispatchResult.delivered ? new Date() : null,
      deliveryReference: dispatchResult.providerReference ?? null,
      lastDeliveryError: dispatchResult.errorMessage ?? dispatchResult.note ?? null,
    },
  });

  return {
    invitation: updatedInvitation,
    invitationLink: getInvitationLink(updatedInvitation.token),
    dispatchResult,
  };
}

export async function getAdminInvitationsSnapshot(input: {
  examSessionId?: string | null;
} = {}) {
  const prisma = getPrismaClient();
  const examSet = await prisma.examSet.findFirst({
    where: input.examSessionId
      ? {
          examSessions: {
            some: {
              id: input.examSessionId,
            },
          },
        }
      : {
          isActive: true,
        },
    include: {
      invitations: {
        where: input.examSessionId ? { examSessionId: input.examSessionId } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          attempts: {
            orderBy: {
              startedAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!examSet) {
    return null;
  }

  return {
    examSet: {
      id: examSet.id,
      title: examSet.title,
    },
    invitations: examSet.invitations.map((invitation) => ({
      id: invitation.id,
      examSessionId: invitation.examSessionId,
      channel: invitation.channel,
      status: invitation.status,
      token: invitation.token,
      recipientName: invitation.recipientName,
      recipientEmail: invitation.recipientEmail,
      recipientPhone: invitation.recipientPhone,
      createdAt: invitation.createdAt,
      sentAt: invitation.sentAt,
      openedAt: invitation.openedAt,
      completedAt: invitation.completedAt,
      expiresAt: invitation.expiresAt,
      lastDeliveryError: invitation.lastDeliveryError,
      latestAttemptId: invitation.attempts[0]?.id ?? null,
      latestAttemptStatus: invitation.attempts[0]?.status ?? null,
      latestAttemptScore: invitation.attempts[0]?.scorePercentage
        ? Number(invitation.attempts[0].scorePercentage.toString())
        : null,
      invitationLink: getInvitationLink(invitation.token),
    })),
  };
}

export async function resolveInvitationLink(token: string) {
  const prisma = getPrismaClient();
  const invitation = await prisma.invitation.findUnique({
    where: {
      token,
    },
    include: {
      examSet: {
        include: {
          examQuestions: {
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
        take: 1,
      },
    },
  });

  if (!invitation) {
    return {
      state: "invalid" as const,
    };
  }

  if (!invitation.examSessionId) {
    return {
      state: "invalid" as const,
    };
  }

  const isExpired = invitation.expiresAt ? invitation.expiresAt.getTime() <= Date.now() : false;

  if (isExpired) {
    await clearParticipantSession();
    await prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: InvitationStatus.EXPIRED,
      },
    });

    return {
      state: "expired" as const,
      invitation: {
        recipientName: invitation.recipientName,
        examTitle: invitation.examSet.title,
      },
    };
  }

  const latestAttempt = invitation.attempts[0];
  const hasActiveAttempt = latestAttempt?.status === AttemptStatus.IN_PROGRESS;
  const hasMatchingSession = await doesParticipantSessionMatchInvitation({
    invitationId: invitation.id,
    expectedNonceHash: invitation.participantSessionNonceHash,
    expectedExpiresAt: invitation.participantSessionExpiresAt,
  });

  if (
    latestAttempt &&
    (latestAttempt.status === AttemptStatus.SUBMITTED ||
      latestAttempt.status === AttemptStatus.AUTO_SUBMITTED)
  ) {
    const nextSession = await createFreshParticipantSession(invitation.id);

    if (invitation.status !== InvitationStatus.COMPLETED) {
      await prisma.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: InvitationStatus.COMPLETED,
          completedAt: new Date(),
          participantSessionNonceHash: nextSession.nonceHash,
          participantSessionExpiresAt: nextSession.expiresAt,
        },
      });
    } else {
      await prisma.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          participantSessionNonceHash: nextSession.nonceHash,
          participantSessionExpiresAt: nextSession.expiresAt,
        },
      });
    }

    return {
      state: "redirect_result" as const,
      attemptId: latestAttempt.id,
    };
  }

  if (
    hasActiveAttempt &&
    invitation.participantSessionNonceHash &&
    invitation.participantSessionExpiresAt &&
    invitation.participantSessionExpiresAt.getTime() > Date.now() &&
    !hasMatchingSession
  ) {
    return {
      state: "locked" as const,
      invitation: {
        recipientName: invitation.recipientName,
        examTitle: invitation.examSet.title,
      },
    };
  }

  const nextSession = hasMatchingSession
    ? null
    : await createFreshParticipantSession(invitation.id);

  await prisma.invitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      status: InvitationStatus.OPENED,
      openedAt: invitation.openedAt ?? new Date(),
      participantSessionNonceHash:
        nextSession?.nonceHash ?? invitation.participantSessionNonceHash,
      participantSessionExpiresAt:
        nextSession?.expiresAt ?? invitation.participantSessionExpiresAt,
    },
  });

  if (latestAttempt?.status === AttemptStatus.IN_PROGRESS) {
    return {
      state: "redirect_exam" as const,
      attemptId: latestAttempt.id,
    };
  }

  const attempt = await createAttempt({
    examSetId: invitation.examSetId,
    examSessionId: invitation.examSessionId,
    invitationId: invitation.id,
    participantName: invitation.recipientName,
    participantEmail: invitation.recipientEmail,
    participantPhone: invitation.recipientPhone,
  });

  return {
    state: "redirect_exam" as const,
    attemptId: attempt.id,
  };
}
