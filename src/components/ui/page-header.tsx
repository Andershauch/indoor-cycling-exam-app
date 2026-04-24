import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "slide-panel rounded-[var(--radius-lg)] px-5 py-6 sm:px-8 sm:py-8",
        className,
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          {eyebrow ? <p className="kicker mb-3">{eyebrow}</p> : null}
          <h1
            className={cn(
              "text-balance font-display font-black uppercase",
              titleClassName ??
                "text-(length:--text-3xl) leading-(--leading-tight) tracking-[-0.05em]",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className={cn("content-copy mt-4 text-base text-foreground", descriptionClassName)}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
