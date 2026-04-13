import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type AnswerChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  text: string;
  helper?: string;
  state?: "default" | "selected" | "correct" | "incorrect";
};

const stateClasses = {
  default: "border-border bg-surface hover:bg-surface-strong",
  selected: "border-border bg-background-soft",
  correct: "border-success bg-[#E6F3EA]",
  incorrect: "border-danger bg-[#FDEDEC]",
};

export function AnswerChoice({
  label,
  text,
  helper,
  state = "default",
  className,
  id,
  ...props
}: AnswerChoiceProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border-2 p-3 transition-colors sm:gap-4 sm:p-5",
        stateClasses[state],
        className,
      )}
    >
      <input {...props} id={id} type="radio" className="sr-only" />
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-current font-display text-base leading-none sm:h-10 sm:w-10 sm:text-lg">
        {label}
      </span>
      <span className="flex min-w-0 flex-col gap-2">
        <span className="text-base font-bold leading-snug text-balance sm:text-lg">{text}</span>
        {helper ? (
          <span className="text-sm leading-6 text-muted-foreground">{helper}</span>
        ) : null}
      </span>
    </label>
  );
}
