import { cn } from "@/lib/utils/cn";

type TimerBadgeTone = "default" | "warning" | "danger";

type TimerBadgeProps = {
  label?: string;
  value: string;
  tone?: TimerBadgeTone;
  className?: string;
};

const toneClasses: Record<TimerBadgeTone, string> = {
  default: "bg-surface text-foreground border-border",
  warning: "bg-[#FFF1D7] text-[#7A3E00] border-[#7A3E00]",
  danger: "bg-[#FDEDEC] text-danger border-danger",
};

export function TimerBadge({
  label = "Tid tilbage",
  value,
  tone = "default",
  className,
}: TimerBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-[var(--radius-pill)] border-2 px-4 py-2",
        toneClasses[tone],
        className,
      )}
    >
      <span className="text-xs font-bold uppercase tracking-[0.12em]">{label}</span>
      <span suppressHydrationWarning className="font-display text-xl leading-none">
        {value}
      </span>
    </div>
  );
}
