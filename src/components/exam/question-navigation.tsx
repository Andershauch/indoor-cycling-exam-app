"use client";

import { cn } from "@/lib/utils/cn";

type QuestionNavigationProps = {
  total: number;
  currentIndex: number;
  answeredIndexes: number[];
  onSelect: (index: number) => void;
};

export function QuestionNavigation({
  total,
  currentIndex,
  answeredIndexes,
  onSelect,
}: QuestionNavigationProps) {
  return (
    <nav aria-label="Spørgsmålsnavigation" className="space-y-3">
      <p className="text-sm font-bold uppercase tracking-[0.08em]">
        Spørgsmål
      </p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {Array.from({ length: total }, (_, index) => {
          const isActive = index === currentIndex;
          const isAnswered = answeredIndexes.includes(index);

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "min-h-11 rounded-[var(--radius-sm)] border-2 text-sm font-bold transition-colors",
                isActive
                  ? "border-border bg-surface-contrast text-inverse-foreground"
                  : isAnswered
                    ? "border-border bg-background-soft text-foreground"
                    : "border-border-soft bg-surface text-foreground",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
