import { AttemptStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { submitAttempt } from "@/lib/exam/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      automatic?: boolean;
    };

    const attempt = await submitAttempt(
      attemptId,
      body.automatic ? AttemptStatus.AUTO_SUBMITTED : AttemptStatus.SUBMITTED,
    );

    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunne ikke aflevere prøven." },
      { status: 400 },
    );
  }
}
