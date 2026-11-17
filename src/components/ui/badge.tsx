import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)]",
        indigo:
          "bg-[var(--accent-indigo)] text-white",
        teal:
          "bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]",
        lavender:
          "bg-[var(--pastel-lavender)] text-[var(--pastel-lavender-ink)]",
        peach:
          "bg-[var(--pastel-peach)] text-[var(--pastel-peach-ink)]",
        lime:
          "bg-[var(--pastel-lime)] text-[var(--pastel-lime-ink)]",
        outline:
          "border border-[var(--border-subtle)] text-[var(--ink-secondary)] bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
