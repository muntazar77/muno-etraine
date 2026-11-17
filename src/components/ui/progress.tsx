import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  indicatorClassName?: string;
  label?: string;
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
  label = "Fortschritt",
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full bg-[var(--accent-teal)] transition-all duration-300 ease-out",
          indicatorClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
