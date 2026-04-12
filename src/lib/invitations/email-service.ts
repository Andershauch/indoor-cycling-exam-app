import type { InvitationDispatchPayload, InvitationDispatchResult } from "@/lib/invitations/types";

function isEmailServiceConfigured() {
  return Boolean(
    (process.env.RESEND_API_KEY || process.env.MAIL_PROVIDER_API_KEY) &&
      process.env.RESEND_FROM_EMAIL,
  );
}

export async function sendInvitationEmail(
  payload: InvitationDispatchPayload,
): Promise<InvitationDispatchResult> {
  if (!payload.recipientEmail) {
    return {
      attempted: false,
      delivered: false,
      errorMessage: "Invitationen mangler modtagerens e-mail.",
    };
  }

  if (!isEmailServiceConfigured()) {
    return {
        attempted: false,
        delivered: false,
        note:
          "TODO: Tilslut rigtig mailprovider. RESEND_API_KEY eller RESEND_FROM_EMAIL mangler.",
      };
  }

  // TODO: Erstat med rigtig providerintegration via Resend.
  return {
    attempted: true,
    delivered: true,
    providerReference: `mail-${Date.now()}`,
  };
}
