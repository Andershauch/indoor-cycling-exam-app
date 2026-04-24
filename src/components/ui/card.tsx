import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type CardTone = "default" | "strong" | "contrast";

type CardProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  tone?: CardTone;
  className?: string;
  titleClassName?: string;
};

const toneClasses: Record<CardTone, string> = {
  default: "surface-card",
  strong: "surface-card-strong",
  contrast: "rounded-[var(--radius-md)] border-2 border-border bg-surface-contrast text-inverse-foreground",
};

export function Card({
  title,
  eyebrow,
  children,
  tone = "default",
  className,
  titleClassName,
}: CardProps) {
  return (
    <section className={cn(toneClasses[tone], "p-5 sm:p-6", className)}>
      {eyebrow ? <p className="kicker mb-3">{eyebrow}</p> : null}
      {title ? (
        <h2
          className={cn(
            "mb-4 text-balance font-display font-black uppercase",
            titleClassName ??
              "text-(length:--text-2xl) leading-(--leading-snug) tracking-[-0.04em]",
          )}
        >
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
