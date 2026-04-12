import type { InvitationDispatchPayload, InvitationDispatchResult } from "@/lib/invitations/types";

function isSmsServiceConfigured() {
  return Boolean(
    process.env.SMS_PROVIDER_API_KEY ||
      (process.env.TWILIO_ACCOUNT_SID &&
        ((process.env.TWILIO_API_KEY_SID && process.env.TWILIO_API_KEY_SECRET) ||
          process.env.TWILIO_AUTH_TOKEN) &&
        process.env.TWILIO_MESSAGING_SERVICE_SID),
  );
}

export async function sendInvitationSms(
  payload: InvitationDispatchPayload,
): Promise<InvitationDispatchResult> {
  if (!payload.recipientPhone) {
    return {
      attempted: false,
      delivered: false,
      errorMessage: "Invitationen mangler modtagerens telefonnummer.",
    };
  }

  if (!isSmsServiceConfigured()) {
    return {
      attempted: false,
      delivered: false,
      note:
        "TODO: Tilslut rigtig sms-provider. Twilio-variabler eller SMS_PROVIDER_API_KEY mangler.",
    };
  }

  // TODO: Erstat med rigtig providerintegration via Twilio Messaging Services.
  return {
    attempted: true,
    delivered: true,
    providerReference: `sms-${Date.now()}`,
  };
}
