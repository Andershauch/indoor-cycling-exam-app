import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "contrast";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-surface-contrast bg-surface-contrast text-white hover:bg-[#252525]",
  secondary:
    "bg-surface text-foreground border-border hover:bg-surface-strong",
  ghost:
    "bg-transparent text-foreground border-border-soft hover:bg-black/5",
  contrast:
    "bg-background text-foreground border-border hover:bg-background-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-sm",
  lg: "min-h-14 px-6 text-base",
};

type ButtonBaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonAsButtonProps = ButtonBaseProps &
  ComponentPropsWithoutRef<"button"> & {
    href?: never;
  };

type ButtonAsLinkProps = ButtonBaseProps & {
  href: string | ComponentPropsWithoutRef<typeof Link>["href"];
} & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">;

export function Button(props: ButtonAsButtonProps | ButtonAsLinkProps) {
  const { children, variant = "primary", size = "md", className } = props;

  const baseClassName = cn(
    "inline-flex items-center justify-center rounded-[var(--radius-pill)] border-2 font-bold uppercase tracking-[0.08em] transition-colors",
    "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if ("href" in props && props.href !== undefined) {
    const linkProps = { ...(props as ButtonAsLinkProps) };
    delete linkProps.children;
    delete linkProps.variant;
    delete linkProps.size;
    delete linkProps.className;

    return (
      <Link
        {...linkProps}
        href={props.href as ComponentPropsWithoutRef<typeof Link>["href"]}
        className={baseClassName}
      >
        {children}
      </Link>
    );
  }

  const buttonProps = { ...(props as ButtonAsButtonProps) };
  delete buttonProps.children;
  delete buttonProps.variant;
  delete buttonProps.size;
  delete buttonProps.className;

  return (
    <button {...buttonProps} className={baseClassName}>
      {children}
    </button>
  );
}
