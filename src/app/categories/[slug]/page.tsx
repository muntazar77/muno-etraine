"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Timer,
  BookOpen,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { getCategoryBySlug } from "@/lib/questions";
import { useTrainerStore } from "@/store/useTrainerStore";
import { ModalDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function CategoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const category = getCategoryBySlug(params.slug);

  const hasHydrated = useTrainerStore((s) => s.hasHydrated);
  const questionProgress = useTrainerStore((s) => s.questionProgress);
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

  if (!category) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-lg font-bold text-[var(--ink-primary)]">
          Kategorie nicht gefunden
        </p>
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-navy)] px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zu allen Kategorien
        </Link>
      </div>
    );
  }

  const totalQuestions = category.subcategories.reduce(
    (acc, s) => acc + s.questions.length,
    0
  );

  const totalCategoryAttempted = hasHydrated
    ? category.subcategories.reduce((acc, sub) => {
        let count = 0;
        for (const q of sub.questions) {
          if ((questionProgress[q.id]?.attempts || 0) > 0) count++;
        }
        return acc + count;
      }, 0)
    : 0;

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
      <div className="space-y-3">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Alle Kategorien
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-indigo)]">
              Fachbereich {category.code}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-primary)] mt-0.5">
              {category.titleDe}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {totalCategoryAttempted > 0 && (
              <button
                type="button"
                onClick={() =>
                  setPendingReset({
                    type: "category",
                    id: category.id,
                    title: `${category.code}. ${category.titleDe}`,
                    answeredCount: totalCategoryAttempted,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs font-semibold text-[var(--ink-secondary)] hover:border-[var(--status-danger)] hover:text-[var(--status-danger)] transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Kategorie zurücksetzen ({totalCategoryAttempted})</span>
              </button>
            )}

            <Link
              href={`/practice?category=${category.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-navy)] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              <span>Gesamte Kategorie üben ({totalQuestions})</span>
            </Link>
            <Link
              href={`/exam?category=${category.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-teal)] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[var(--accent-teal-hover)]"
            >
              <Timer className="h-4 w-4" />
              <span>Kategorie-Prüfung starten</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Subcategories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {category.subcategories.map((sub) => {
          let attempted = 0;
          let correct = 0;
          if (hasHydrated) {
            for (const q of sub.questions) {
              const p = questionProgress[q.id];
              if (p && p.attempts > 0) {
                attempted++;
                if (p.lastCorrect) correct++;
              }
            }
          }
          const pct =
            sub.questions.length > 0
              ? Math.round((attempted / sub.questions.length) * 100)
              : 0;

          return (
            <article
              key={sub.id}
              className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-2xs space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex rounded-md bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--ink-primary)]">
                      Modul {sub.id}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-[var(--ink-primary)] mt-1.5">
                      {sub.titleDe}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {attempted > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPendingReset({
                            type: "subcategory",
                            id: sub.id,
                            title: `Modul ${sub.id} – ${sub.titleDe}`,
                            answeredCount: attempted,
                          })
                        }
                        title="Fortschritt dieses Moduls zurücksetzen"
                        aria-label={`Fortschritt für Modul ${sub.id} ${sub.titleDe} zurücksetzen`}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-secondary)] hover:border-[var(--status-danger)] hover:text-[var(--status-danger)] transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Zurücksetzen</span>
                      </button>
                    )}

                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pastel-teal)] px-3 py-1 text-xs font-bold text-[var(--pastel-teal-ink)]">
                      <Clock className="h-3 w-3" /> {sub.recommendedTimeMinutes} Min.
                    </span>
                  </div>
                </div>

                {sub.instructionsDe && (
                  <p className="text-xs text-[var(--ink-secondary)] line-clamp-3 leading-relaxed">
                    {sub.instructionsDe}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ink-secondary)]">
                    <strong className="text-[var(--ink-primary)]">
                      {sub.questions.length}
                    </strong>{" "}
                    Aufgaben • {attempted} bearbeitet ({correct} gemeistert)
                  </span>
                  <span className="font-bold text-[var(--ink-primary)] tabular-nums">
                    {pct}%
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent-teal)] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Link
                    href={`/lernhilfen?category=${category.id}&subcategory=${sub.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-semibold text-[var(--ink-secondary)] hover:border-[var(--accent-indigo)] hover:text-[var(--ink-primary)] transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-[var(--accent-indigo)]" />
                    <span>Lernhilfe</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/practice?category=${category.id}&subcategory=${sub.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-navy)] hover:text-white transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Üben</span>
                    </Link>
                    <Link
                      href={`/exam?category=${category.id}&subcategory=${sub.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-indigo)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-indigo-hover)] transition-colors"
                    >
                      <Timer className="h-3.5 w-3.5" />
                      <span>Zeit-Test ({sub.recommendedTimeMinutes}m)</span>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Confirmation Dialog for Reset */}
      <ModalDialog
        open={Boolean(pendingReset)}
        onClose={() => setPendingReset(null)}
        titleId="subcat-reset-dialog-title"
      >
        {pendingReset && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--status-danger)]/15 text-[var(--status-danger)]">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2
                  id="subcat-reset-dialog-title"
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
                  und deren Fehlereinträge unwiderruflich zurückgesetzt. Alle
                  anderen Module bleiben erhalten.
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
