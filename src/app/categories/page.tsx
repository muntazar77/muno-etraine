"use client";

import * as React from "react";
import Link from "next/link";
import {
  Layers,
  Grid,
  Compass,
  Cpu,
  Scale,
  Globe2,
  Clock,
  ChevronRight,
  Sparkles,
  Timer,
  RotateCcw,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import { getQuestionBank } from "@/lib/questions";
import { useTrainerStore, computeTrainerAnalytics } from "@/store/useTrainerStore";
import { ModalDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const CAT_STYLES: Record<
  string,
  {
    pastelBg: string;
    pastelInk: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }
> = {
  "cat-1": {
    pastelBg: "bg-[var(--pastel-lavender)]",
    pastelInk: "text-[var(--pastel-lavender-ink)]",
    icon: Layers,
  },
  "cat-2": {
    pastelBg: "bg-[var(--pastel-peach)]",
    pastelInk: "text-[var(--pastel-peach-ink)]",
    icon: Grid,
  },
  "cat-3": {
    pastelBg: "bg-[var(--pastel-lime)]",
    pastelInk: "text-[var(--pastel-lime-ink)]",
    icon: Compass,
  },
  "cat-4": {
    pastelBg: "bg-[var(--pastel-teal)]",
    pastelInk: "text-[var(--pastel-teal-ink)]",
    icon: Cpu,
  },
  "cat-5": {
    pastelBg: "bg-[var(--pastel-lavender)]",
    pastelInk: "text-[var(--pastel-lavender-ink)]",
    icon: Scale,
  },
  "cat-6": {
    pastelBg: "bg-[var(--pastel-peach)]",
    pastelInk: "text-[var(--pastel-peach-ink)]",
    icon: Globe2,
  },
};

export default function CategoriesPage() {
  const bank = getQuestionBank();
  const hasHydrated = useTrainerStore((s) => s.hasHydrated);
  const questionProgress = useTrainerStore((s) => s.questionProgress);
  const examHistory = useTrainerStore((s) => s.examHistory);
  const bookmarks = useTrainerStore((s) => s.bookmarks);
  const revisionFlaggedIds = useTrainerStore((s) => s.revisionFlaggedIds);
  const resetCategoryProgress = useTrainerStore((s) => s.resetCategoryProgress);
  const resetSubcategoryProgress = useTrainerStore(
    (s) => s.resetSubcategoryProgress
  );

  const [pendingReset, setPendingReset] = React.useState<{
    type: "category" | "subcategory";
    id: string;
    title: string;
    answeredCount: number;
  } | null>(null);

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

  const handleConfirmReset = () => {
    if (!pendingReset) return;
    if (pendingReset.type === "category") {
      resetCategoryProgress(pendingReset.id);
    } else {
      resetSubcategoryProgress(pendingReset.id);
    }
    setPendingReset(null);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
            Fachbereiche &amp; Unterkategorien
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Alle {bank.meta.totalCategories} Hauptkategorien und{" "}
            {bank.meta.totalSubcategories} Prüfungsmodule mit{" "}
            {bank.meta.totalQuestions} validierten Aufgaben.
          </p>
        </div>

        <Link
          href="/lernhilfen"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-bold text-[var(--ink-primary)] hover:border-[var(--accent-indigo)] transition-colors"
        >
          <GraduationCap className="h-4 w-4 text-[var(--accent-indigo)]" />
          <span>Zu den 32 Lernhilfen →</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analytics.categoryStats.map((item) => {
          const style = CAT_STYLES[item.category.id] || CAT_STYLES["cat-1"];
          const Icon = style.icon;
          const totalRecommendedMins = item.category.subcategories.reduce(
            (acc, s) => acc + s.recommendedTimeMinutes,
            0
          );

          return (
            <article
              key={item.category.id}
              className="flex flex-col justify-between rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-2xs space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.pastelBg} ${style.pastelInk}`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </span>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                        Kategorie {item.category.code}
                      </span>
                      <h2 className="text-lg font-bold text-[var(--ink-primary)]">
                        <Link
                          href={`/categories/${item.category.slug}`}
                          className="hover:underline"
                        >
                          {item.category.titleDe}
                        </Link>
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.attemptedCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPendingReset({
                            type: "category",
                            id: item.category.id,
                            title: `${item.category.code}. ${item.category.titleDe}`,
                            answeredCount: item.attemptedCount,
                          })
                        }
                        title="Fortschritt dieser Kategorie zurücksetzen"
                        aria-label={`Fortschritt für ${item.category.titleDe} zurücksetzen`}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-secondary)] hover:border-[var(--status-danger)] hover:text-[var(--status-danger)] transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Zurücksetzen</span>
                      </button>
                    )}

                    <span className="rounded-full bg-[var(--bg-surface-subtle)] px-3 py-1 text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                      {item.totalQuestions} Fragen
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-[var(--ink-secondary)]">
                    <span>
                      {item.attemptedCount} von {item.totalQuestions} bearbeitet (
                      {item.completionPercent}%)
                    </span>
                    <span className="font-bold text-[var(--ink-primary)]">
                      {item.accuracyPercent !== null
                        ? `${item.accuracyPercent}% Genauigkeit`
                        : "Noch offen"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent-teal)] transition-all duration-300"
                      style={{ width: `${item.completionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Preview of Subcategories */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    Enthaltene Unterkategorien ({item.category.subcategories.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.category.subcategories.slice(0, 5).map((sub) => {
                      let subAttempted = 0;
                      if (hasHydrated) {
                        for (const q of sub.questions) {
                          if ((questionProgress[q.id]?.attempts || 0) > 0) {
                            subAttempted++;
                          }
                        }
                      }
                      return (
                        <div
                          key={sub.id}
                          className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-medium text-[var(--ink-secondary)] overflow-hidden"
                        >
                          <Link
                            href={`/practice?category=${item.category.id}&subcategory=${sub.id}`}
                            className="px-2.5 py-1 hover:text-[var(--ink-primary)] transition-colors"
                          >
                            {sub.id} {sub.titleDe} ({sub.questions.length})
                          </Link>
                          {subAttempted > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setPendingReset({
                                  type: "subcategory",
                                  id: sub.id,
                                  title: `Modul ${sub.id} ${sub.titleDe}`,
                                  answeredCount: subAttempted,
                                })
                              }
                              title={`Modul ${sub.id} zurücksetzen (${subAttempted} beantwortet)`}
                              aria-label={`Modul ${sub.id} ${sub.titleDe} zurücksetzen`}
                              className="border-l border-[var(--border-subtle)] px-1.5 py-1 text-[var(--ink-muted)] hover:bg-[var(--status-danger)]/10 hover:text-[var(--status-danger)] cursor-pointer"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {item.category.subcategories.length > 5 && (
                      <Link
                        href={`/categories/${item.category.slug}`}
                        className="rounded-lg bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-primary)]"
                      >
                        +{item.category.subcategories.length - 5} weitere
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
                  <Clock className="h-3.5 w-3.5" /> {totalRecommendedMins} Min.
                  Gesamtrichtzeit
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/practice?category=${item.category.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] px-3.5 py-2 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-navy)] hover:text-white transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Üben</span>
                  </Link>
                  <Link
                    href={`/exam?category=${item.category.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-teal)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-teal-hover)] transition-colors"
                  >
                    <Timer className="h-3.5 w-3.5" />
                    <span>Prüfung</span>
                  </Link>
                  <Link
                    href={`/categories/${item.category.slug}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-[var(--surface-navy)] px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <span>Alle Module</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Confirmation Dialog for Category / Subcategory Reset */}
      <ModalDialog
        open={Boolean(pendingReset)}
        onClose={() => setPendingReset(null)}
        titleId="categories-reset-dialog-title"
      >
        {pendingReset && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--status-danger)]/15 text-[var(--status-danger)]">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2
                  id="categories-reset-dialog-title"
                  className="text-lg font-bold text-[var(--ink-primary)]"
                >
                  Fortschritt für „{pendingReset.title}“ zurücksetzen?
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-1 leading-relaxed">
                  Dabei werden{" "}
                  <strong className="text-[var(--ink-primary)] tabular-nums">
                    {pendingReset.answeredCount}{" "}
                    {pendingReset.answeredCount === 1
                      ? "beantwortete Frage"
                      : "beantwortete Fragen"}
                  </strong>{" "}
                  und deren Fehlereinträge in diesem Bereich gelöscht. Alle
                  anderen Kategorien und Module bleiben unverändert.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                autoFocus
                onClick={() => setPendingReset(null)}
              >
                Abbrechen
              </Button>
              <Button variant="danger" onClick={handleConfirmReset}>
                Ja, {pendingReset.answeredCount}{" "}
                {pendingReset.answeredCount === 1 ? "Frage" : "Fragen"}{" "}
                zurücksetzen
              </Button>
            </div>
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
