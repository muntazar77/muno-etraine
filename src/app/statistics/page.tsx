"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Timer,
  ArrowUpRight,
} from "lucide-react";
import {
  useTrainerStore,
  computeTrainerAnalytics,
} from "@/store/useTrainerStore";
import { formatDuration, formatRelativeDate, cn } from "@/lib/utils";

export default function StatisticsPage() {
  const hasHydrated = useTrainerStore((s) => s.hasHydrated);
  const questionProgress = useTrainerStore((s) => s.questionProgress);
  const examHistory = useTrainerStore((s) => s.examHistory);
  const bookmarks = useTrainerStore((s) => s.bookmarks);
  const revisionFlaggedIds = useTrainerStore((s) => s.revisionFlaggedIds);
  const recentActivity = useTrainerStore((s) => s.recentActivity);

  const analytics = React.useMemo(
    () =>
      computeTrainerAnalytics({
        questionProgress: hasHydrated ? questionProgress : {},
        examHistory: hasHydrated ? examHistory : [],
        bookmarks: hasHydrated ? bookmarks : [],
        revisionFlaggedIds: hasHydrated ? revisionFlaggedIds : [],
      }),
    [hasHydrated, questionProgress, examHistory, bookmarks, revisionFlaggedIds]
  );

  // Recent sessions chronological for accuracy-over-time chart
  const chronologicalSessions = React.useMemo(
    () => (hasHydrated ? [...examHistory].slice(0, 10).reverse() : []),
    [hasHydrated, examHistory]
  );

  return (
    <div className="space-y-9 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
            Lernfortschritt &amp; Leistungsanalyse
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Echte Auswertung deiner bisherigen Versuche, Stärken nach
            Fachbereich und schwächsten Unterkategorien.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-navy)] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            <span>Training starten</span>
          </Link>
        </div>
      </div>

      {/* Top Summary Metrics */}
      <section
        aria-label="Kernkennzahlen"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-2xs">
          <span className="text-xs font-semibold text-[var(--ink-secondary)]">
            Abgeschlossene Fragen
          </span>
          <p className="text-3xl font-bold text-[var(--ink-primary)] mt-2 tabular-nums">
            {analytics.attemptedQuestionsCount}
            <span className="text-sm font-medium text-[var(--ink-muted)]">
              {" "}
              / {analytics.totalQuestions}
            </span>
          </p>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            {analytics.masteredCount} beim letzten Versuch korrekt
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-2xs">
          <span className="text-xs font-semibold text-[var(--ink-secondary)]">
            Gesamtgenauigkeit
          </span>
          <p className="text-3xl font-bold text-[var(--accent-teal)] mt-2 tabular-nums">
            {analytics.attemptedQuestionsCount > 0
              ? `${analytics.overallAccuracy}%`
              : "—"}
          </p>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Über alle protokollierten Versuche
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-2xs">
          <span className="text-xs font-semibold text-[var(--ink-secondary)]">
            Absolvierte Prüfungen
          </span>
          <p className="text-3xl font-bold text-[var(--ink-primary)] mt-2 tabular-nums">
            {analytics.completedExamsCount}
          </p>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            {analytics.completedSessionsCount} Sitzungen inkl. Übungen
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-2xs">
          <span className="text-xs font-semibold text-[var(--ink-secondary)]">
            Offene Fehler
          </span>
          <p className="text-3xl font-bold text-[var(--ink-primary)] mt-2 tabular-nums">
            {analytics.mistakeIds.length}
          </p>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Im Fehlertraining abrufbar
          </p>
        </div>
      </section>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Performance by Category + Accuracy Over Time */}
        <div className="lg:col-span-7 space-y-8">
          {/* Performance by Category */}
          <section
            aria-labelledby="perf-by-cat-heading"
            className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 space-y-5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <h2
                id="perf-by-cat-heading"
                className="text-lg font-bold text-[var(--ink-primary)]"
              >
                Leistung nach Kategorien
              </h2>
              <span className="text-xs text-[var(--ink-muted)]">
                Bearbeitung &amp; Trefferquote
              </span>
            </div>

            <div className="space-y-4">
              {analytics.categoryStats.map((item) => (
                <div key={item.category.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <Link
                      href={`/categories/${item.category.slug}`}
                      className="font-bold text-[var(--ink-primary)] hover:underline"
                    >
                      {item.category.code}. {item.category.titleDe}
                    </Link>
                    <div className="flex items-center gap-3 text-xs tabular-nums">
                      <span className="text-[var(--ink-secondary)]">
                        {item.attemptedCount}/{item.totalQuestions} Fragen (
                        {item.completionPercent}%)
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 font-bold",
                          item.accuracyPercent === null
                            ? "bg-[var(--bg-surface-subtle)] text-[var(--ink-muted)]"
                            : item.accuracyPercent >= 75
                              ? "bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]"
                              : item.accuracyPercent >= 50
                                ? "bg-[var(--pastel-peach)] text-[var(--pastel-peach-ink)]"
                                : "bg-[var(--status-danger)]/15 text-[var(--status-danger)]"
                        )}
                      >
                        {item.accuracyPercent !== null
                          ? `${item.accuracyPercent}%`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent-teal)] transition-all duration-300"
                      style={{ width: `${item.completionPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Accuracy Over Time (Only renders chart when sessions exist, meaningful empty state otherwise) */}
          <section
            aria-labelledby="accuracy-trend-heading"
            className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 space-y-5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <h2
                id="accuracy-trend-heading"
                className="text-lg font-bold text-[var(--ink-primary)]"
              >
                Genauigkeitsverlauf über die Zeit
              </h2>
              <span className="text-xs text-[var(--ink-muted)]">
                Letzte {chronologicalSessions.length} Sitzungen
              </span>
            </div>

            {chronologicalSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 p-6 text-center space-y-2">
                <p className="text-sm font-bold text-[var(--ink-primary)]">
                  Noch keine abgeschlossenen Prüfungen oder Sitzungen
                </p>
                <p className="text-xs text-[var(--ink-secondary)] max-w-md mx-auto">
                  Sobald du deine erste Übungssitzung oder Prüfungssimulation
                  beendest, wird hier dein realer Genauigkeitsverlauf
                  visualisiert.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end pt-4 min-h-[150px]">
                  {chronologicalSessions.map((sess, i) => (
                    <div
                      key={sess.id}
                      className="flex flex-col items-center justify-end gap-2 h-36"
                    >
                      <span className="text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                        {sess.accuracyPercent}%
                      </span>
                      <div className="w-full max-w-[44px] bg-[var(--bg-surface-subtle)] rounded-xl h-24 flex items-end overflow-hidden p-1">
                        <div
                          className={cn(
                            "w-full rounded-lg transition-all",
                            sess.accuracyPercent >= 60
                              ? "bg-[var(--accent-teal)]"
                              : "bg-[var(--accent-indigo)]"
                          )}
                          style={{
                            height: `${Math.max(12, sess.accuracyPercent)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--ink-muted)] truncate max-w-full">
                        #{i + 1} {sess.subjectLabel.slice(0, 12)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Weakest Subcategories + Recent Exam Results & Study Activity */}
        <div className="lg:col-span-5 space-y-8">
          {/* Weakest Subcategories */}
          <section
            aria-labelledby="weakest-sub-heading"
            className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 space-y-4 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <h2
                id="weakest-sub-heading"
                className="text-lg font-bold text-[var(--ink-primary)]"
              >
                Schwächste Unterkategorien
              </h2>
              <Target className="h-4 w-4 text-[var(--ink-muted)]" />
            </div>

            {analytics.weakestSubcategories.length === 0 ? (
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed py-2">
                Noch keine Unterkategorien mit auswertbaren Versuchen vorhanden.
                Bearbeite erste Aufgaben, um hier gezielte Empfehlungen zu
                erhalten.
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.weakestSubcategories.map((sub) => (
                  <div
                    key={sub.subcategoryId}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--ink-primary)] truncate">
                        {sub.subcategoryId} {sub.subcategoryTitleDe}
                      </p>
                      <p className="text-[11px] text-[var(--ink-secondary)] truncate">
                        {sub.categoryTitleDe} • {sub.attemptedCount}/
                        {sub.totalQuestions} bearbeitet
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-[var(--pastel-peach)] px-2.5 py-0.5 text-xs font-bold text-[var(--pastel-peach-ink)] tabular-nums">
                        {sub.accuracyPercent}%
                      </span>
                      <Link
                        href={`/practice?category=${sub.categoryId}&subcategory=${sub.subcategoryId}`}
                        className="rounded-lg bg-[var(--surface-navy)] px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90"
                      >
                        Üben
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Exam Results */}
          <section
            aria-labelledby="recent-exams-heading"
            className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 space-y-4 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <h2
                id="recent-exams-heading"
                className="text-lg font-bold text-[var(--ink-primary)]"
              >
                Letzte Prüfungsergebnisse
              </h2>
              <Link
                href="/history"
                className="text-xs font-semibold text-[var(--accent-indigo)] hover:underline"
              >
                Alle anzeigen
              </Link>
            </div>

            {!hasHydrated || examHistory.length === 0 ? (
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed py-2">
                Noch keine abgeschlossenen Prüfungen vorhanden.
              </p>
            ) : (
              <div className="space-y-2.5">
                {examHistory.slice(0, 5).map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--ink-primary)] truncate">
                        {exam.title} ({exam.subjectLabel})
                      </p>
                      <p className="text-[11px] text-[var(--ink-secondary)]">
                        {formatRelativeDate(exam.completedAt)} •{" "}
                        {exam.correctCount}/{exam.totalQuestions} richtig
                      </p>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold tabular-nums shrink-0",
                        exam.passed
                          ? "bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]"
                          : "bg-[var(--pastel-peach)] text-[var(--pastel-peach-ink)]"
                      )}
                    >
                      {exam.accuracyPercent}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
