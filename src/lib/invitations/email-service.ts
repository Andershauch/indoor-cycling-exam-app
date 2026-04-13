import type { InvitationDispatchPayload, InvitationDispatchResult } from "@/lib/invitations/types";

const RESEND_API_URL = "https://api.resend.com/emails";

function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY || process.env.MAIL_PROVIDER_API_KEY || "",
    fromEmail: process.env.RESEND_FROM_EMAIL || "",
  };
}

function isEmailServiceConfigured() {
  const config = getEmailConfig();
  return Boolean(config.apiKey && config.fromEmail);
}

function buildSubject(examTitle: string) {
  return `Din invitation til ${examTitle}`;
}

function buildTextBody(payload: InvitationDispatchPayload) {
  const greeting = payload.recipientName
    ? `Hej ${payload.recipientName},`
    : "Hej,";

  return [
    greeting,
    "",
    `Du er inviteret til at gennemføre prøven "${payload.examTitle}".`,
    "",
    "Åbn prøven her:",
    payload.invitationLink,
    "",
    "Linket åbner direkte til prøven.",
  ].join("\n");
}

function buildHtmlBody(payload: InvitationDispatchPayload) {
  const greeting = payload.recipientName
    ? `Hej ${payload.recipientName},`
    : "Hej,";

  return `
    <div style="font-family: Arial, sans-serif; color: #111111; line-height: 1.6;">
      <p>${greeting}</p>
      <p>Du er inviteret til at gennemføre prøven "<strong>${payload.examTitle}</strong>".</p>
      <p>
        <a
          href="${payload.invitationLink}"
          style="display:inline-block;padding:12px 18px;background:#FEE81F;color:#111111;text-decoration:none;font-weight:700;border-radius:8px;"
        >
          Åbn prøven
        </a>
      </p>
      <p>Hvis knappen ikke virker, kan du åbne dette link direkte:</p>
      <p><a href="${payload.invitationLink}">${payload.invitationLink}</a></p>
    </div>
  `.trim();
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

  const config = getEmailConfig();

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: [payload.recipientEmail],
        subject: buildSubject(payload.examTitle),
        text: buildTextBody(payload),
        html: buildHtmlBody(payload),
      }),
    });

    const body = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!response.ok) {
      return {
        attempted: true,
        delivered: false,
        errorMessage: body?.message || "Resend afviste e-mailen.",
        note: body?.name || null,
      };
    }

    return {
      attempted: true,
      delivered: true,
      providerReference: body?.id ?? null,
    };
  } catch (error) {
    return {
      attempted: true,
      delivered: false,
      errorMessage:
        error instanceof Error ? error.message : "Ukendt fejl ved afsendelse med Resend.",
    };
  }
}
