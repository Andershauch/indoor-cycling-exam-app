import { cn } from "@/lib/utils/cn";

type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  className?: string;
};

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-4 text-sm font-bold uppercase tracking-[0.08em]">
        <span>{label ?? "Progression"}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div
        aria-hidden="true"
        className="h-4 rounded-full border-2 border-border bg-surface"
      >
        <div
          className="h-full rounded-full bg-surface-contrast transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
