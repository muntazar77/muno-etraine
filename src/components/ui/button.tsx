import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--surface-navy)] text-white hover:not-disabled:opacity-92 rounded-xl shadow-xs",
        indigo:
          "bg-[var(--accent-indigo)] text-white hover:not-disabled:bg-[var(--accent-indigo-hover)] rounded-xl shadow-xs",
        teal:
          "bg-[var(--accent-teal)] text-white hover:not-disabled:bg-[var(--accent-teal-hover)] rounded-full shadow-xs",
        outline:
          "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:not-disabled:bg-[var(--bg-surface-subtle)] rounded-xl",
        pillOutline:
          "border border-[var(--border-exam)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:not-disabled:border-[var(--accent-indigo)] rounded-full",
        pillActive:
          "border border-[var(--accent-indigo)] bg-[var(--accent-indigo)] text-white rounded-full shadow-xs",
        ghost:
          "text-[var(--ink-secondary)] hover:not-disabled:bg-[var(--bg-surface-subtle)] hover:not-disabled:text-[var(--ink-primary)] rounded-xl",
        danger:
          "bg-[var(--status-danger)] text-white hover:not-disabled:opacity-90 rounded-xl",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-8 px-3 py-1.5 text-xs",
        lg: "min-h-12 px-6 py-3 text-base",
        pill: "min-h-10 px-5 py-2",
        icon: "min-h-10 min-w-10 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
