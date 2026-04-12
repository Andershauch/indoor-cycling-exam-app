"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { QuestionNavigation } from "@/components/exam/question-navigation";
import { AnswerChoice } from "@/components/ui/answer-choice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TimerBadge } from "@/components/ui/timer-badge";
import type { AttemptExamSnapshot } from "@/lib/exam/types";

type ExamRunnerProps = {
  attempt: AttemptExamSnapshot;
};

function formatTimeLeft(milliseconds: number) {
  const safeMs = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ExamRunner({ attempt }: ExamRunnerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeIndex, setActiveIndex] = useState(attempt.currentQuestionIndex);
  const [answers, setAnswers] = useState(() => {
    const initial = new Map<string, string | null>();

    attempt.answers.forEach((answer) => {
      initial.set(answer.examQuestionId, answer.selectedOptionId);
    });

    return initial;
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState(
    "Dine svar gemmes løbende, så du ikke mister data ved refresh.",
  );
  const [timeLeft, setTimeLeft] = useState(() => {
    return Math.max(0, new Date(attempt.expiresAt).getTime() - Date.now());
  });
  const autoSubmittedRef = useRef(false);
  const pendingSaveCountRef = useRef(0);
  const pendingAnswerSaveRef = useRef<Promise<void> | null>(null);
  const pendingProgressRef = useRef<Promise<void> | null>(null);

  const currentQuestion = attempt.questions[activeIndex];
  const answeredIndexes = attempt.questions.flatMap((question, index) =>
    answers.get(question.examQuestionId) ? [index] : [],
  );

  async function persistProgress(nextIndex: number) {
    pendingSaveCountRef.current += 1;
    setSaveState("saving");
    setSaveMessage("Gemmer din placering i prøven...");

    const request = fetch(`/api/exam/attempts/${attempt.attemptId}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        currentQuestionIndex: nextIndex,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error || "Placeringen kunne ikke gemmes.");
        }

        setSaveState("idle");
        setSaveMessage("Placering gemt.");
      })
      .catch((error) => {
        setSaveState("error");
        setSaveMessage(
          error instanceof Error
            ? error.message
            : "Kunne ikke gemme din placering i prøven.",
        );
      })
      .finally(() => {
        pendingSaveCountRef.current = Math.max(0, pendingSaveCountRef.current - 1);
        pendingProgressRef.current = null;
      });

    pendingProgressRef.current = request;
    await request;
  }

  async function handleSelectAnswer(
    examQuestionId: string,
    selectedOptionId: string,
  ) {
    const previous = answers.get(examQuestionId) ?? null;

    setAnswers((current) => {
      const next = new Map(current);
      next.set(examQuestionId, selectedOptionId);
      return next;
    });
    pendingSaveCountRef.current += 1;
    setSaveState("saving");
    setSaveMessage("Gemmer dit svar...");

    const request = fetch(`/api/exam/attempts/${attempt.attemptId}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        examQuestionId,
        selectedOptionId,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error || "Svar kunne ikke gemmes.");
        }

        setSaveState("idle");
        setSaveMessage("Svar gemt.");
      })
      .catch((error) => {
        setAnswers((current) => {
          const next = new Map(current);
          next.set(examQuestionId, previous);
          return next;
        });
        setSaveState("error");
        setSaveMessage(
          error instanceof Error ? error.message : "Kunne ikke gemme dit sidste valg.",
        );
      })
      .finally(() => {
        pendingSaveCountRef.current = Math.max(0, pendingSaveCountRef.current - 1);
        pendingAnswerSaveRef.current = null;
      });

    pendingAnswerSaveRef.current = request;
    await request;
  }

  function goToQuestion(nextIndex: number) {
    setActiveIndex(nextIndex);
    startTransition(() => {
      void persistProgress(nextIndex);
    });
  }

  async function submitAttempt(automatic: boolean) {
    if (!automatic) {
      const confirmed = window.confirm(
        "Vil du aflevere prøven nu? Du kan ikke ændre svar bagefter.",
      );

      if (!confirmed) {
        return;
      }
    }

    if (pendingAnswerSaveRef.current) {
      await pendingAnswerSaveRef.current;
    }

    if (pendingProgressRef.current) {
      await pendingProgressRef.current;
    }

    const response = await fetch(`/api/exam/attempts/${attempt.attemptId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        automatic,
      }),
    });

    if (!response.ok) {
      setSaveState("error");
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setSaveMessage(payload?.error || "Prøven kunne ikke afleveres.");
      return;
    }

    router.replace(`/result/${attempt.attemptId}`);
    router.refresh();
  }

  const handleAutomaticSubmit = useEffectEvent(() => {
    if (autoSubmittedRef.current) {
      return;
    }

    autoSubmittedRef.current = true;
    void submitAttempt(true);
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextValue = Math.max(
        0,
        new Date(attempt.expiresAt).getTime() - Date.now(),
      );

      setTimeLeft(nextValue);

      if (nextValue <= 0 && !autoSubmittedRef.current) {
        handleAutomaticSubmit();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [attempt.expiresAt]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (pendingSaveCountRef.current === 0) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <div className="slide-grid space-y-6 py-6 sm:py-8 lg:space-y-8 lg:py-10">
      <PageHeader
        eyebrow="Prøve"
        title={`SPØRGSMÅL ${String(activeIndex + 1).padStart(2, "0")}`}
        description={`Du kan gå frem og tilbage og ændre dine svar helt frem til aflevering.`}
        actions={
          <TimerBadge
            value={formatTimeLeft(timeLeft)}
            tone={timeLeft <= 60_000 ? "danger" : timeLeft <= 5 * 60_000 ? "warning" : "default"}
          />
        }
      />

      <section className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <Card tone="strong" className="space-y-5">
          <ProgressBar
            value={answeredIndexes.length}
            max={attempt.questions.length}
            label="Besvaret"
          />
          <QuestionNavigation
            total={attempt.questions.length}
            currentIndex={activeIndex}
            answeredIndexes={answeredIndexes}
            onSelect={goToQuestion}
          />
          <div className="space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.08em]">Status</p>
            <p
              aria-live="polite"
              className="text-base leading-7 text-muted-foreground"
            >
              {saveMessage}
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => void submitAttempt(false)}
            disabled={isPending || saveState === "saving"}
          >
            Aflever prøve
          </Button>
        </Card>

        <Card className="space-y-6">
          <div className="space-y-3">
            <p className="kicker">
              {currentQuestion.category ?? "Fast prøve"}
            </p>
            <h2 className="section-title">VÆLG DET BEDSTE SVAR</h2>
            <p className="text-xl font-bold leading-snug">
              {currentQuestion.questionText}
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="sr-only">
              Vælg det bedste svar til spørgsmålet
            </legend>
            {currentQuestion.options.map((option) => (
              <AnswerChoice
                key={option.id}
                id={option.id}
                name={currentQuestion.examQuestionId}
                label={option.label}
                text={option.text}
                checked={answers.get(currentQuestion.examQuestionId) === option.id}
                onChange={() =>
                  void handleSelectAnswer(currentQuestion.examQuestionId, option.id)
                }
                state={
                  answers.get(currentQuestion.examQuestionId) === option.id
                    ? "selected"
                    : "default"
                }
              />
            ))}
          </fieldset>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => goToQuestion(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
            >
              Tilbage
            </Button>
            <Button
              size="lg"
              onClick={() =>
                goToQuestion(
                  Math.min(attempt.questions.length - 1, activeIndex + 1),
                )
              }
              disabled={activeIndex === attempt.questions.length - 1}
            >
              Næste spørgsmål
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
