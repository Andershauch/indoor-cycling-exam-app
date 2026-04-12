import { notFound, redirect } from "next/navigation";
import { AttemptStatus } from "@prisma/client";

import { AnswerChoice } from "@/components/ui/answer-choice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getAttemptSnapshot, isAttemptExpired, submitAttempt } from "@/lib/exam/service";

export const dynamic = "force-dynamic";

export default async function AttemptResultPage({
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

  if (attempt.status === "IN_PROGRESS") {
    redirect(`/exam/${attempt.attemptId}`);
  }

  const passed = (attempt.scorePercentage ?? 0) >= attempt.passPercentage;
  const answerState = new Map(
    attempt.answers.map((answer) => [answer.examQuestionId, answer]),
  );

  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Resultat"
        title={passed ? "DU HAR BESTÅET" : "DU HAR IKKE BESTÅET"}
        description="Resultatet er beregnet direkte ved aflevering på baggrund af dine senest gemte svar."
      />

      <section className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <Card tone="contrast" className="space-y-6">
          <div className="space-y-3">
            <p className="kicker text-inverse-foreground/80">Samlet score</p>
            <p className="font-display text-[4.5rem] leading-none">
              {Math.round(attempt.scorePercentage ?? 0)}%
            </p>
            <p className="text-lg font-bold">
              {attempt.correctAnswerCount ?? 0} rigtige ud af {attempt.totalQuestionCount}
            </p>
          </div>
          <ProgressBar
            value={attempt.scorePercentage ?? 0}
            label="Opnået score"
          />
          <div className="flex flex-wrap gap-3">
            <Button href="/" variant="contrast" size="lg">
              Til forsiden
            </Button>
          </div>
        </Card>

        <Card title="Gennemgang" eyebrow="Svaroversigt" className="space-y-4">
          {attempt.questions.map((question) => {
            const answer = answerState.get(question.examQuestionId);

            return (
              <div
                key={question.examQuestionId}
                className="space-y-3 border-b border-border-soft pb-4 last:border-b-0 last:pb-0"
              >
                <p className="text-sm font-bold uppercase tracking-[0.08em]">
                  Spørgsmål {question.position}
                </p>
                <p className="text-lg font-bold leading-snug">
                  {question.questionText}
                </p>
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const isSelected = answer?.selectedOptionId === option.id;
                    const state =
                      option.isCorrect && !answer?.isCorrect
                        ? "correct"
                        : option.id === answer?.selectedOptionId
                          ? answer?.isCorrect
                            ? "correct"
                            : "incorrect"
                          : "default";

                    return (
                      <AnswerChoice
                        key={option.id}
                        id={`${question.examQuestionId}-${option.id}`}
                        name={`${question.examQuestionId}-review`}
                        label={option.label}
                        text={option.text}
                        checked={isSelected}
                        readOnly
                        state={state}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}
