"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { QuestionNavigation } from "@/components/exam/question-navigation";
import { AnswerChoice } from "@/components/ui/answer-choice";
import { Button } from "@/components/ui/button";
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
    "Dine svar gemmes løbende, så du ikke mister noget undervejs.",
  );
  const [timeLeft, setTimeLeft] = useState(() => {
    return Math.max(0, new Date(attempt.expiresAt).getTime() - Date.now());
  });
  const autoSubmittedRef = useRef(false);
  const pendingSaveCountRef = useRef(0);
  const pendingAnswerSaveRef = useRef<Promise<void> | null>(null);
  const pendingProgressRef = useRef<Promise<void> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  const currentQuestion = attempt.questions[activeIndex];
  const answeredIndexes = attempt.questions.flatMap((question, index) =>
    answers.get(question.examQuestionId) ? [index] : [],
  );
  const currentAnswer = answers.get(currentQuestion.examQuestionId) ?? null;
  const isLastQuestion = activeIndex === attempt.questions.length - 1;

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

  function goToPreviousQuestion() {
    goToQuestion(Math.max(0, activeIndex - 1));
  }

  function goToNextQuestion() {
    goToQuestion(Math.min(attempt.questions.length - 1, activeIndex + 1));
  }

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchEndRef.current = null;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd() {
    if (!touchStartRef.current || !touchEndRef.current) {
      return;
    }

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const horizontalSwipe = Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;

    if (!horizontalSwipe) {
      return;
    }

    if (deltaX < 0 && activeIndex < attempt.questions.length - 1) {
      goToNextQuestion();
    }

    if (deltaX > 0 && activeIndex > 0) {
      goToPreviousQuestion();
    }
  }

  async function submitAttempt(automatic: boolean) {
    if (!automatic) {
      const confirmed = window.confirm(
        "Vil du aflevere prøven nu? Du kan ikke ændre dine svar bagefter.",
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
      const nextValue = Math.max(0, new Date(attempt.expiresAt).getTime() - Date.now());

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
    <div className="space-y-4 pb-28 pt-2">
      <section className="participant-sticky-bar grid gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="kicker">Aktiv prøve</p>
            <div className="flex flex-wrap gap-2">
              <span className="participant-status-chip">
                Spørgsmål {activeIndex + 1} af {attempt.questions.length}
              </span>
              {currentAnswer ? (
                <span className="participant-status-chip">Svar valgt</span>
              ) : (
                <span className="participant-status-chip">Afventer svar</span>
              )}
              <span className="participant-status-chip">Swipe for næste</span>
            </div>
          </div>
          <TimerBadge
            value={formatTimeLeft(timeLeft)}
            tone={timeLeft <= 60_000 ? "danger" : timeLeft <= 5 * 60_000 ? "warning" : "default"}
            className="shrink-0"
          />
        </div>
        <ProgressBar
          value={answeredIndexes.length}
          max={attempt.questions.length}
          label="Besvaret"
        />
      </section>

      <details className="participant-surface p-5">
        <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.08em]">
          Se spørgeoversigt
        </summary>
        <div className="mt-4">
          <QuestionNavigation
            total={attempt.questions.length}
            currentIndex={activeIndex}
            answeredIndexes={answeredIndexes}
            onSelect={goToQuestion}
          />
        </div>
      </details>

      <section
        className="participant-question-card participant-surface grid gap-5 p-5 sm:gap-6 sm:p-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="space-y-3">
          <p className="kicker">{currentQuestion.category ?? "Fast prøve"}</p>
          <h1 className="section-title">
            Spørgsmål {String(activeIndex + 1).padStart(2, "0")}
          </h1>
          <p className="text-xl font-bold leading-snug text-balance sm:text-2xl">
            {currentQuestion.questionText}
          </p>
        </div>

        <fieldset className="grid gap-3">
          <legend className="sr-only">Vælg det bedste svar</legend>
          {currentQuestion.options.map((option) => (
            <AnswerChoice
              key={option.id}
              id={option.id}
              name={currentQuestion.examQuestionId}
              label={option.label}
              text={option.text}
              checked={currentAnswer === option.id}
              onChange={() => void handleSelectAnswer(currentQuestion.examQuestionId, option.id)}
              state={currentAnswer === option.id ? "selected" : "default"}
            />
          ))}
        </fieldset>

        <div className="rounded-[1.25rem] border border-border-soft bg-white/55 p-4">
          <p aria-live="polite" className="text-sm leading-6 text-muted-foreground">
            {saveMessage}
          </p>
        </div>
      </section>

      <section className="participant-footer-nav grid gap-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={goToPreviousQuestion}
            disabled={activeIndex === 0}
          >
            Tilbage
          </Button>
          {isLastQuestion ? (
            <Button
              size="lg"
              onClick={() => void submitAttempt(false)}
              disabled={isPending || saveState === "saving"}
            >
              Aflever
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={goToNextQuestion}
            >
              Næste
            </Button>
          )}
        </div>
        {!isLastQuestion ? (
          <Button
            variant="ghost"
            size="md"
            onClick={() => void submitAttempt(false)}
            disabled={isPending || saveState === "saving"}
          >
            Aflever prøve
          </Button>
        ) : null}
      </section>
    </div>
  );
}
