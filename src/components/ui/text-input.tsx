import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextInput({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: TextInputProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold uppercase tracking-[0.08em]">{label}</span>
      <input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={cn(
          "min-h-12 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 text-base text-foreground placeholder:text-muted-foreground",
          "focus-visible:outline-none",
          error ? "border-danger" : "",
          className,
        )}
      />
      {hint ? (
        <span id={id ? `${id}-hint` : undefined} className="text-sm text-muted-foreground">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={id ? `${id}-error` : undefined} className="text-sm font-bold text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
