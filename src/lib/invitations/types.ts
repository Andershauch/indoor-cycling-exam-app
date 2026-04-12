import type { InvitationChannel } from "@prisma/client";

export type InvitationDispatchPayload = {
  recipientName: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  invitationLink: string;
  examTitle: string;
};

export type InvitationDispatchResult = {
  attempted: boolean;
  delivered: boolean;
  providerReference?: string | null;
  errorMessage?: string | null;
  note?: string | null;
};

export type InvitationSender = (
  payload: InvitationDispatchPayload,
) => Promise<InvitationDispatchResult>;

export type SupportedInvitationChannel = InvitationChannel;
