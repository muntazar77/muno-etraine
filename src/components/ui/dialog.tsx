"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Accessible native modal <dialog> wrapper adhering to modern-web-guidance:
 * - Uses native showModal() and close()
 * - Does NOT add redundant role="dialog" or aria-modal
 * - Resets dialog.returnValue = '' on close so Esc and button closes never leak stale values
 */
export function ModalDialog({
  open,
  onClose,
  titleId,
  children,
  className,
}: ModalDialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      onClose();
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={cn(
        "m-auto w-[min(92vw,30rem)] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--ink-primary)] shadow-xl open:block",
        className
      )}
    >
      {children}
    </dialog>
  );
}
