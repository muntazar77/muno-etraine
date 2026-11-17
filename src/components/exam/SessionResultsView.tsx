"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  Bookmark,
  ArrowLeft,
  Trophy,
  Clock,
  Target,
} from "lucide-react";
import type { CompletedExamRecord } from "@/store/useTrainerStore";
import { useTrainerStore } from "@/store/useTrainerStore";
import { getQuestionById } from "@/lib/questions";
import { formatDuration, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SessionResultsViewProps {
  record: CompletedExamRecord;
  onStartNew: () => void;
  onRetryMistakes?: (mistakeQuestionIds: string[]) => void;
}

export function SessionResultsView({
  record,
  onStartNew,
  onRetryMistakes,
}: SessionResultsViewProps) {
  const [filter, setFilter] = React.useState<"all" | "incorrect" | "unanswered">("all");
  const bookmarks = useTrainerStore((s) => s.bookmarks);
  const toggleBookmark = useTrainerStore((s) => s.toggleBookmark);
  const settings = useTrainerStore((s) => s.settings);

  const incorrectIds = React.useMemo(
    () =>
      record.results
        .filter((r) => !r.isCorrect)
        .map((r) => r.questionId),
    [record.results]
  );

  const filteredResults = React.useMemo(() => {
    return record.results.filter((r) => {
      if (filter === "incorrect") return !r.isCorrect;
      if (filter === "unanswered") return !r.isAnswered;
      return true;
    });
  }, [record.results, filter]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Result Hero Banner */}
      <section className="rounded-[28px] bg-[var(--surface-navy)] p-6 sm:p-8 lg:p-10 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider",
                record.passed
                  ? "bg-[var(--pastel-lime)] text-[var(--pastel-lime-ink)]"
                  : "bg-[var(--pastel-peach)] text-[var(--pastel-peach-ink)]"
              )}
            >
              <Trophy className="h-3.5 w-3.5" />
              {record.passed ? "Bestanden" : "Weiteres Training empfohlen"}
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {record.title} – Auswertung
            </h1>
            <p className="text-sm text-white/75">
              Fachbereich: <strong className="text-white">{record.subjectLabel}</strong> •{" "}
              {record.correctCount} von {record.totalQuestions} Fragen richtig beantwortet.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
            <div className="rounded-2xl bg-white/10 px-4 py-3.5 text-center">
              <span className="block text-2xl sm:text-3xl font-bold text-[var(--pastel-lime)] tabular-nums">
                {record.accuracyPercent}%
              </span>
              <span className="text-[11px] text-white/70">Ergebnis</span>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3.5 text-center">
              <span className="block text-2xl sm:text-3xl font-bold text-white tabular-nums">
                {record.correctCount}/{record.totalQuestions}
              </span>
              <span className="text-[11px] text-white/70">Korrekt</span>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3.5 text-center">
              <span className="block text-2xl sm:text-3xl font-bold text-white tabular-nums">
                {formatDuration(record.durationSeconds)}
              </span>
              <span className="text-[11px] text-white/70">Dauer</span>
            </div>
          </div>
        </div>

        <div className="mt-7 pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={onStartNew}
              className="bg-white text-[#1B1C30] hover:bg-white/90 rounded-full px-6 font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              Neue Sitzung konfigurieren
            </Button>

            {incorrectIds.length > 0 && onRetryMistakes && (
              <Button
                variant="teal"
                onClick={() => onRetryMistakes(incorrectIds)}
                className="px-6 font-semibold"
              >
                <RotateCcw className="h-4 w-4" />
                {incorrectIds.length} falsche/offene Fragen wiederholen
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-white/80">
            <Link href="/statistics" className="hover:underline">
              Zu den Statistiken →
            </Link>
            <span>•</span>
            <Link href="/history" className="hover:underline">
              Prüfungshistorie →
            </Link>
          </div>
        </div>
      </section>

      {/* Filter Bar for Detailed Question Review */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-[var(--ink-primary)]">
          Einzelauswertung aller Fragen ({filteredResults.length})
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              filter === "all"
                ? "bg-[var(--surface-navy)] text-white"
                : "bg-[var(--bg-surface)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]"
            )}
          >
            Alle ({record.results.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("incorrect")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              filter === "incorrect"
                ? "bg-[var(--status-danger)] text-white"
                : "bg-[var(--bg-surface)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]"
            )}
          >
            Falsch / Offen ({incorrectIds.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unanswered")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              filter === "unanswered"
                ? "bg-[var(--accent-indigo)] text-white"
                : "bg-[var(--bg-surface)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]"
            )}
          >
            Unbeantwortet ({record.results.filter((r) => !r.isAnswered).length})
          </button>
        </div>
      </div>

      {/* Detailed Question-by-Question Review List */}
      <div className="space-y-4">
        {filteredResults.map((res, idx) => {
          const q = getQuestionById(res.questionId);
          if (!q) return null;
          const isBookmarked = bookmarks.includes(q.id);

          const formattedUserAnswer =
            res.userAnswer === null || res.userAnswer === ""
              ? "Keine Antwort abgegeben"
              : Array.isArray(res.userAnswer)
                ? res.userAnswer.join(", ")
                : res.userAnswer;

          const formattedCorrect = q.correctAnswers
            .map((ansKey) => {
              const foundOpt = q.options.find(
                (o) => o.key.toUpperCase() === ansKey.toUpperCase()
              );
              return foundOpt ? `${foundOpt.key}: ${foundOpt.text}` : ansKey;
            })
            .join(" | ");

          const userSelectedOptionText =
            !Array.isArray(res.userAnswer) && res.userAnswer
              ? q.options.find(
                  (o) => o.key.toUpperCase() === String(res.userAnswer).toUpperCase()
                )?.text
              : undefined;

          return (
            <article
              key={q.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--bg-surface-subtle)] px-3 py-1 text-xs font-bold text-[var(--ink-primary)]">
                    Frage {idx + 1} • [{q.id}]
                  </span>
                  <span className="text-xs font-medium text-[var(--ink-secondary)]">
                    {q.subcategoryId} {q.subcategoryTitleDe}
                  </span>
                  {res.isCorrect ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pastel-teal)] px-2.5 py-0.5 text-xs font-bold text-[var(--pastel-teal-ink)]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Richtig
                    </span>
                  ) : res.isAnswered ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--status-danger)]/15 px-2.5 py-0.5 text-xs font-bold text-[var(--status-danger)]">
                      <XCircle className="h-3.5 w-3.5" /> Falsch
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pastel-peach)] px-2.5 py-0.5 text-xs font-bold text-[var(--pastel-peach-ink)]">
                      <MinusCircle className="h-3.5 w-3.5" /> Unbeantwortet
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleBookmark(q.id)}
                  aria-label={
                    isBookmarked ? "Lesezeichen entfernen" : "Als Lesezeichen speichern"
                  }
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer",
                    isBookmarked
                      ? "border-[var(--accent-indigo)] bg-[var(--accent-indigo)] text-white"
                      : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)]"
                  )}
                >
                  <Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
                </button>
              </div>

              <p className="text-base sm:text-lg font-semibold text-[var(--ink-primary)] whitespace-pre-line">
                {q.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div
                  className={cn(
                    "rounded-xl p-3.5 border",
                    res.isCorrect
                      ? "border-[var(--accent-teal)]/40 bg-[var(--pastel-teal)]/40"
                      : "border-[var(--status-danger)]/35 bg-[var(--status-danger)]/8"
                  )}
                >
                  <span className="block font-bold uppercase tracking-wider text-[10px] text-[var(--ink-secondary)] mb-1">
                    Deine Antwort
                  </span>
                  <span className="font-semibold text-sm text-[var(--ink-primary)]">
                    {formattedUserAnswer}
                    {userSelectedOptionText ? `: ${userSelectedOptionText}` : ""}
                  </span>
                </div>

                <div className="rounded-xl p-3.5 border border-[var(--accent-teal)]/40 bg-[var(--pastel-teal)]/40">
                  <span className="block font-bold uppercase tracking-wider text-[10px] text-[var(--pastel-teal-ink)] mb-1">
                    Korrekte Lösung
                  </span>
                  <span className="font-semibold text-sm text-[var(--ink-primary)]">
                    {formattedCorrect}
                  </span>
                </div>
              </div>

              {(q.explanationDe || q.explanationAr) && (
                <div className="rounded-xl bg-[var(--bg-canvas)] p-4 space-y-2 border border-[var(--border-subtle)]">
                  {q.explanationDe &&
                    (settings.explanationLanguage === "both" ||
                      settings.explanationLanguage === "de") && (
                      <p className="text-xs sm:text-sm text-[var(--ink-primary)] leading-relaxed">
                        <strong className="font-semibold">Erklärung: </strong>
                        {q.explanationDe}
                      </p>
                    )}
                  {q.explanationAr &&
                    (settings.explanationLanguage === "both" ||
                      settings.explanationLanguage === "ar") && (
                      <p
                        dir="rtl"
                        lang="ar"
                        className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed font-medium"
                      >
                        {q.explanationAr}
                      </p>
                    )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
