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
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
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
  const activeIndexRef = useRef(attempt.currentQuestionIndex);
  const pendingSaveCountRef = useRef(0);
  const pendingAnswerSaveRef = useRef<Promise<void> | null>(null);
  const pendingProgressRef = useRef<Promise<void> | null>(null);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);
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

  function scheduleAutoAdvance(expectedIndex: number) {
    if (expectedIndex >= attempt.questions.length - 1) {
      return;
    }

    if (autoAdvanceTimeoutRef.current) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
    }

    autoAdvanceTimeoutRef.current = window.setTimeout(() => {
      if (activeIndexRef.current !== expectedIndex) {
        autoAdvanceTimeoutRef.current = null;
        return;
      }

      const nextIndex = Math.min(attempt.questions.length - 1, expectedIndex + 1);
      setActiveIndex(nextIndex);
      startTransition(() => {
        void persistProgress(nextIndex);
      });
      autoAdvanceTimeoutRef.current = null;
    }, 220);
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
        scheduleAutoAdvance(activeIndex);
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
    if (autoAdvanceTimeoutRef.current) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

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
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

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

  useEffect(() => {
    if (!isOverviewOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOverviewOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOverviewOpen]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="participant-exam-shell pt-1">
        <section className="participant-sticky-bar grid gap-2 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="kicker">Aktiv prøve</p>
            <TimerBadge
              value={formatTimeLeft(timeLeft)}
              tone={timeLeft <= 60_000 ? "danger" : timeLeft <= 5 * 60_000 ? "warning" : "default"}
              className="shrink-0 [&_span:first-child]:text-[0.65rem] [&_span:last-child]:text-lg"
            />
          </div>
          <ProgressBar
            value={answeredIndexes.length}
            max={attempt.questions.length}
            label={`Spørgsmål ${activeIndex + 1} af ${attempt.questions.length}`}
          />
        </section>

        <div className="participant-exam-content px-1 pb-3 pt-3">
          <section
            className="participant-question-card participant-surface grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-4 p-4 sm:gap-5 sm:p-5"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="space-y-2">
              <p className="kicker">{currentQuestion.category ?? "Fast prøve"}</p>
              <h1 className="section-title">
                Spørgsmål {String(activeIndex + 1).padStart(2, "0")}
              </h1>
            </div>

            <div className="min-h-0 overflow-y-auto pr-1">
              <div className="space-y-4">
                <p className="text-lg font-bold leading-snug text-balance sm:text-xl">
                  {currentQuestion.questionText}
                </p>
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
              </div>
            </div>

            <div className="rounded-[1rem] border border-border-soft bg-white/55 p-3">
              <p aria-live="polite" className="text-xs leading-5 text-muted-foreground">
                {saveMessage}
              </p>
            </div>
          </section>
        </div>

        <section className="participant-footer-nav grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 px-2.5 pt-2.5">
          <Button
            variant="secondary"
            size="sm"
            className="w-full px-0 text-base"
            onClick={goToPreviousQuestion}
            disabled={activeIndex === 0}
            aria-label="Forrige spørgsmål"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.5 4.5L7 10l5.5 5.5" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full px-2 text-[0.7rem] tracking-[0.04em]"
            onClick={() => setIsOverviewOpen(true)}
          >
            Oversigt
          </Button>
          <Button
            size="sm"
            className="w-full px-2 text-[0.7rem] tracking-[0.04em]"
            onClick={() => void submitAttempt(false)}
            disabled={isPending || saveState === "saving"}
          >
            Aflever
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full px-0 text-base"
            onClick={goToNextQuestion}
            disabled={isLastQuestion}
            aria-label="Næste spørgsmål"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7.5 4.5L13 10l-5.5 5.5" />
            </svg>
          </Button>
        </section>
      </div>

      {isOverviewOpen ? (
        <>
          <button
            type="button"
            aria-label="Luk spørgeoversigt"
            className="participant-sheet-backdrop"
            onClick={() => setIsOverviewOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Spørgeoversigt"
            className="participant-sheet-panel"
          >
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-black/15" />
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="kicker">Skift spørgsmål</p>
                <p className="text-sm text-muted-foreground">
                  Tryk på et nummer for at hoppe direkte.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOverviewOpen(false)}
              >
                Luk
              </Button>
            </div>
            <QuestionNavigation
              total={attempt.questions.length}
              currentIndex={activeIndex}
              answeredIndexes={answeredIndexes}
              onSelect={(index) => {
                setIsOverviewOpen(false);
                goToQuestion(index);
              }}
            />
          </section>
        </>
      ) : null}
    </>
  );
}
