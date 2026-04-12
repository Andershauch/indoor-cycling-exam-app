import { NextResponse } from "next/server";

import { updateAttemptProgress } from "@/lib/exam/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    const body = (await request.json()) as {
      currentQuestionIndex?: number;
    };

    if (
      typeof body.currentQuestionIndex !== "number" ||
      !Number.isFinite(body.currentQuestionIndex)
    ) {
      return NextResponse.json(
        { error: "currentQuestionIndex mangler." },
        { status: 400 },
      );
    }

    await updateAttemptProgress({
      attemptId,
      currentQuestionIndex: body.currentQuestionIndex,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunne ikke gemme progression." },
      { status: 400 },
    );
  }
}
