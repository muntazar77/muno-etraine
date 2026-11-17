"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History,
  Trophy,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Timer,
} from "lucide-react";
import { useTrainerStore } from "@/store/useTrainerStore";
import { SessionResultsView } from "@/components/exam/SessionResultsView";
import { formatDuration, formatRelativeDate, cn } from "@/lib/utils";

export default function ExamHistoryPage() {
  const router = useRouter();
  const hasHydrated = useTrainerStore((s) => s.hasHydrated);
  const examHistory = useTrainerStore((s) => s.examHistory);
  const startSession = useTrainerStore((s) => s.startSession);

  const [selectedRecordId, setSelectedRecordId] = React.useState<string | null>(
    null
  );

  const selectedRecord = React.useMemo(
    () => examHistory.find((r) => r.id === selectedRecordId) || null,
    [examHistory, selectedRecordId]
  );

  if (selectedRecord) {
    return (
      <SessionResultsView
        record={selectedRecord}
        onStartNew={() => setSelectedRecordId(null)}
        onRetryMistakes={(mistakeIds) => {
          startSession({
            mode: "practice",
            title: `Wiederholung: ${selectedRecord.title}`,
            subjectLabel: selectedRecord.subjectLabel,
            categoryId: selectedRecord.categoryId,
            subcategoryId: selectedRecord.subcategoryId,
            questionIds: mistakeIds,
            timeLimitSeconds: null,
          });
          router.push("/practice");
        }}
      />
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
            Prüfungshistorie
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Alle abgeschlossenen Prüfungssimulationen und Übungssitzungen mit
            detaillierter Einzelauswertung.
          </p>
        </div>

        <Link
          href="/exam?configure=1"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-teal)] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[var(--accent-teal-hover)]"
        >
          <Timer className="h-4 w-4" />
          <span>Neue Prüfung starten</span>
        </Link>
      </div>

      {!hasHydrated || examHistory.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 p-10 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--pastel-peach)] text-[var(--pastel-peach-ink)]">
            <History className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-[var(--ink-primary)]">
            Noch keine Einträge in der Historie
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] max-w-md mx-auto leading-relaxed">
            Beende deine erste Prüfungssimulation oder Übungseinheit, um das
            Ergebnis, deine benötigte Zeit und alle Antworten hier dauerhaft
            einzusehen.
          </p>
          <div className="pt-2">
            <Link
              href="/exam"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-navy)] px-4 py-2 text-xs font-semibold text-white"
            >
              Jetzt erste Modellprüfung ablegen
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {examHistory.map((item) => (
            <article
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                      item.mode === "exam"
                        ? "bg-[var(--surface-navy)] text-white"
                        : "bg-[var(--pastel-lavender)] text-[var(--pastel-lavender-ink)]"
                    )}
                  >
                    {item.mode === "exam" ? "Prüfung" : "Übung"}
                  </span>
                  <span className="text-xs text-[var(--ink-muted)]">
                    {formatRelativeDate(item.completedAt)}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                  {item.title} • {item.subjectLabel}
                </h2>

                <p className="text-xs text-[var(--ink-secondary)]">
                  {item.correctCount} von {item.totalQuestions} richtig (
                  {item.answeredCount} beantwortet) • Dauer:{" "}
                  {formatDuration(item.durationSeconds)}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <div className="text-right">
                  <span
                    className={cn(
                      "inline-block rounded-full px-3.5 py-1 text-sm font-bold tabular-nums",
                      item.passed
                        ? "bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]"
                        : "bg-[var(--pastel-peach)] text-[var(--pastel-peach-ink)]"
                    )}
                  >
                    {item.accuracyPercent}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRecordId(item.id)}
                  className="rounded-xl bg-[var(--surface-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
                >
                  Details &amp; Fragen prüfen
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
