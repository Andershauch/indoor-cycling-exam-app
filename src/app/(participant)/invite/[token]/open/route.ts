import { NextResponse } from "next/server";

import { resolveInvitationLink } from "@/lib/invitations/service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ token: string }>;
  },
) {
  const { token } = await context.params;
  const resolution = await resolveInvitationLink(token);
  const baseUrl = new URL(request.url);

  if (resolution.state === "redirect_result") {
    return NextResponse.redirect(new URL(`/result/${resolution.attemptId}`, baseUrl));
  }

  if (resolution.state === "redirect_exam") {
    return NextResponse.redirect(new URL(`/exam/${resolution.attemptId}`, baseUrl));
  }

  return NextResponse.redirect(new URL(`/invite/${token}?state=${resolution.state}`, baseUrl));
}
