import { notFound, redirect } from "next/navigation";
import { AttemptStatus } from "@prisma/client";

import { ExamRunner } from "@/components/exam/exam-runner";
import { getAttemptSnapshot, isAttemptComplete, isAttemptExpired, submitAttempt } from "@/lib/exam/service";

export const dynamic = "force-dynamic";

export default async function ActiveExamPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const attempt = await getAttemptSnapshot(attemptId);

  if (!attempt) {
    notFound();
  }

  if (attempt.status === "IN_PROGRESS" && isAttemptExpired(attempt.expiresAt)) {
    await submitAttempt(attempt.attemptId, AttemptStatus.AUTO_SUBMITTED);
    redirect(`/result/${attempt.attemptId}`);
  }

  if (isAttemptComplete(attempt.status)) {
    redirect(`/result/${attempt.attemptId}`);
  }

  return <ExamRunner attempt={attempt} />;
}
