import { notFound, redirect } from "next/navigation";
import { AttemptStatus } from "@prisma/client";

import { AnswerChoice } from "@/components/ui/answer-choice";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-4 pb-8 pt-2">
      <section className="participant-score-card">
        <div className="space-y-3">
          <p className="kicker text-inverse-foreground/80">Resultat</p>
          <h1 className="participant-title text-inverse-foreground">
            {passed ? "Bestået" : "Ikke bestået"}
          </h1>
          <p className="text-base leading-7 text-inverse-foreground/78">
            Resultatet er beregnet på baggrund af dine senest gemte svar.
          </p>
        </div>
        <div className="space-y-3">
          <p className="participant-score-value">{Math.round(attempt.scorePercentage ?? 0)}%</p>
          <p className="text-lg font-bold">
            {attempt.correctAnswerCount ?? 0} rigtige ud af {attempt.totalQuestionCount}
          </p>
        </div>
        <ProgressBar
          value={attempt.scorePercentage ?? 0}
          label="Opnået score"
          className="text-inverse-foreground"
        />
      </section>

      <section className="participant-surface grid gap-4 p-6">
        <div className="space-y-2">
          <p className="kicker">Afslutning</p>
          <h2 className="section-title">
            {passed ? "Du er i mål" : "Tak for din besvarelse"}
          </h2>
          <p className="participant-lead">
            {passed
              ? "Din prøve er registreret som bestået."
              : "Din besvarelse er registreret. Kontakt underviseren, hvis du vil følge op på resultatet."}
          </p>
        </div>
        <Button href="/" size="lg">
          Til forsiden
        </Button>
      </section>

      <section className="participant-surface grid gap-4 p-6">
        <div className="space-y-2">
          <p className="kicker">Svaroversigt</p>
          <h2 className="section-title">Se dine svar</h2>
        </div>
        <div className="grid gap-5">
          {attempt.questions.map((question) => {
            const answer = answerState.get(question.examQuestionId);

            return (
              <article
                key={question.examQuestionId}
                className="grid gap-3 border-b border-border-soft pb-5 last:border-b-0 last:pb-0"
              >
                <div className="space-y-2">
                  <p className="participant-status-chip">
                    Spørgsmål {question.position}
                  </p>
                  <h3 className="text-xl font-bold leading-snug">{question.questionText}</h3>
                </div>
                <div className="grid gap-2">
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
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
