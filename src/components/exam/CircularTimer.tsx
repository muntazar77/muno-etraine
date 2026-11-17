"use client";

import * as React from "react";
import { formatDuration } from "@/lib/utils";

interface CircularTimerProps {
  remainingSeconds: number | null;
  totalSeconds: number | null;
  label?: string;
}

export function CircularTimer({
  remainingSeconds,
  totalSeconds,
  label = "Verbleibende Zeit:",
}: CircularTimerProps) {
  if (remainingSeconds === null || totalSeconds === null || totalSeconds <= 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-exam)] bg-[var(--bg-surface)] p-6 flex flex-col items-center justify-center text-center shadow-2xs">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-[var(--border-exam)]">
          <span className="text-sm font-bold text-[var(--ink-secondary)]">Ohne Limit</span>
        </div>
        <p className="mt-3 text-xs font-semibold text-[var(--ink-secondary)]">
          Freier Übungsmodus
        </p>
      </div>
    );
  }

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, remainingSeconds / totalSeconds));
  const strokeDashoffset = circumference * (1 - ratio);

  const isLow = remainingSeconds <= 120;
  const isCritical = remainingSeconds <= 30;

  const strokeColor = isCritical
    ? "var(--status-danger)"
    : isLow
      ? "var(--status-warning)"
      : "var(--accent-teal)";

  return (
    <div className="rounded-2xl border border-[var(--border-exam)] bg-[var(--bg-surface)] p-6 flex flex-col items-center justify-center text-center shadow-2xs">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg
          viewBox="0 0 112 112"
          className="h-28 w-28 -rotate-90"
          role="img"
          aria-label={`Verbleibende Zeit: ${formatDuration(remainingSeconds)}`}
        >
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="var(--border-exam)"
            strokeWidth="7"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-500 ease-linear"
          />
        </svg>
        <span
          className="absolute text-lg font-bold tabular-nums tracking-tight"
          style={{ color: strokeColor }}
        >
          {formatDuration(remainingSeconds)}
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold text-[var(--ink-primary)]">{label}</p>
    </div>
  );
}
