import { NextResponse } from "next/server";

import { saveAnswer } from "@/lib/exam/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    const body = (await request.json()) as {
      examQuestionId?: string;
      selectedOptionId?: string | null;
    };

    if (!body.examQuestionId) {
      return NextResponse.json(
        { error: "Spørgsmåls-id mangler." },
        { status: 400 },
      );
    }

    await saveAnswer({
      attemptId,
      examQuestionId: body.examQuestionId,
      selectedOptionId: body.selectedOptionId ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunne ikke gemme svar." },
      { status: 400 },
    );
  }
}
