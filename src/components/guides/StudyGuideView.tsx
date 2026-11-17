"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  X,
  ListChecks,
  Lightbulb,
} from "lucide-react";
import type { StudyGuide } from "@/lib/schema";
import { cn } from "@/lib/utils";

export interface StudyGuideViewProps {
  guide: StudyGuide;
  onClose?: () => void;
  /** When opened inside an active Practice session for this module, allow closing to continue without resetting */
  inActivePractice?: boolean;
}

export function StudyGuideView({
  guide,
  onClose,
  inActivePractice = false,
}: StudyGuideViewProps) {
  const practiceUrl = `/practice?category=${guide.categoryId}&subcategory=${guide.subcategoryId}`;

  return (
    <div className="space-y-6">
      {/* Guide Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-[var(--surface-navy)] px-2.5 py-1 font-mono text-xs font-bold text-white">
              Modul {guide.subcategoryId}
            </span>
            <span className="inline-flex items-center rounded-full bg-[var(--bg-surface-subtle)] px-3 py-1 text-xs font-semibold text-[var(--ink-secondary)]">
              {guide.categoryCode}. {guide.categoryTitleDe}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pastel-teal)] px-2.5 py-1 text-xs font-bold text-[var(--pastel-teal-ink)]">
              <Clock className="h-3 w-3" /> {guide.recommendedTimeMinutes} Min. •{" "}
              {guide.questionCount} Fragen
            </span>
          </div>

          <h2
            id={`guide-title-${guide.subcategoryId}`}
            className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)]"
          >
            {guide.titleDe}
          </h2>
          <p
            dir="rtl"
            lang="ar"
            className="text-sm sm:text-base font-bold text-[var(--accent-indigo)]"
          >
            {guide.titleAr}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Lernhilfe schließen"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 1. Goldene Regel / القاعدة الذهبية */}
      <section
        aria-label="Goldene Regel"
        className="rounded-2xl bg-[var(--surface-navy)] p-5 sm:p-6 text-white space-y-3 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--pastel-lime)] px-3 py-1 text-xs font-bold text-[var(--pastel-lime-ink)]">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Goldene Regel</span>
          </span>
          <span
            dir="rtl"
            lang="ar"
            className="text-xs font-bold text-[var(--pastel-lime)]"
          >
            القاعدة الذهبية
          </span>
        </div>

        <p className="text-sm sm:text-base font-semibold leading-relaxed text-white">
          {guide.coreRuleDe}
        </p>

        <p
          dir="rtl"
          lang="ar"
          className="text-sm sm:text-base font-medium leading-relaxed text-white/90 border-t border-white/15 pt-3"
        >
          {guide.coreRuleAr}
        </p>
      </section>

      {/* 2. Schritt-für-Schritt-Methode / خطوات الحل السريع */}
      <section aria-label="Schritt-für-Schritt-Methode" className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-bold text-[var(--ink-primary)]">
            <ListChecks className="h-4 w-4 text-[var(--accent-indigo)]" />
            <span>Schritt-für-Schritt-Methode</span>
          </h3>
          <span
            dir="rtl"
            lang="ar"
            className="text-sm font-bold text-[var(--ink-secondary)]"
          >
            خطوات الحل السريع
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {guide.steps.map((s) => (
            <div
              key={s.step}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 space-y-2"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-indigo)] text-xs font-bold text-white tabular-nums mt-0.5">
                  {s.step}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-[var(--ink-primary)] leading-relaxed">
                  {s.de}
                </p>
              </div>
              <p
                dir="rtl"
                lang="ar"
                className="text-xs sm:text-sm text-[var(--ink-secondary)] font-medium leading-relaxed pr-2 border-t border-[var(--border-subtle)]/70 pt-2"
              >
                {s.ar}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Typische Prüfungsfallen / فخاخ الامتحان */}
      <section aria-label="Typische Prüfungsfallen" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-bold text-[var(--ink-primary)]">
            <AlertTriangle className="h-4 w-4 text-[var(--status-warning)]" />
            <span>Typische Prüfungsfallen</span>
          </h3>
          <span
            dir="rtl"
            lang="ar"
            className="text-sm font-bold text-[var(--ink-secondary)]"
          >
            فخاخ الامتحان
          </span>
        </div>

        <div className="space-y-2.5">
          {guide.examTraps.map((trap, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[var(--status-warning)]/40 bg-[var(--pastel-peach)]/45 p-4 space-y-2"
            >
              <p className="text-xs sm:text-sm font-semibold text-[var(--pastel-peach-ink)] leading-relaxed">
                • {trap.de}
              </p>
              <p
                dir="rtl"
                lang="ar"
                className="text-xs sm:text-sm font-medium text-[var(--pastel-peach-ink)]/90 leading-relaxed"
              >
                • {trap.ar}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 2 Gelöste Beispiele / أمثلة محلولة */}
      <section aria-label="Gelöste Beispiele" className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-bold text-[var(--ink-primary)]">
            <BookOpen className="h-4 w-4 text-[var(--accent-teal)]" />
            <span>2 Gelöste Beispiele (Mittel &amp; Schwer)</span>
          </h3>
          <span
            dir="rtl"
            lang="ar"
            className="text-sm font-bold text-[var(--ink-secondary)]"
          >
            أمثلة محلولة
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {guide.examples.map((ex, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 sm:p-5 space-y-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider",
                    ex.difficulty === "schwer"
                      ? "bg-[var(--pastel-lavender)] text-[var(--pastel-lavender-ink)]"
                      : "bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]"
                  )}
                >
                  Beispiel {idx + 1} • Schwierigkeit: {ex.difficulty}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-navy)] px-3 py-1 font-mono text-xs font-bold text-[var(--pastel-lime)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Lösung: {ex.answerDe}</span>
                </span>
              </div>

              <div className="rounded-xl bg-[var(--bg-surface)] p-3.5 border border-[var(--border-subtle)]">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1">
                  Aufgabenstellung (Originalformat)
                </span>
                <p className="text-sm sm:text-base font-bold text-[var(--ink-primary)] whitespace-pre-line">
                  {ex.problemDe}
                </p>
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                <p className="text-[var(--ink-primary)] leading-relaxed">
                  <strong className="font-bold text-[var(--accent-teal)]">
                    Rechenweg (DE):{" "}
                  </strong>
                  {ex.stepsDe}
                </p>
                <p
                  dir="rtl"
                  lang="ar"
                  className="text-[var(--ink-secondary)] font-medium leading-relaxed border-t border-[var(--border-subtle)] pt-2"
                >
                  <strong className="font-bold text-[var(--accent-indigo)]">
                    طريقة الحل (AR):{" "}
                  </strong>
                  {ex.stepsAr}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Direct Action Footer */}
      <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
        {inActivePractice && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-surface-subtle)] cursor-pointer"
          >
            Zurück zur laufenden Aufgabe
          </button>
        ) : (
          <span className="text-xs text-[var(--ink-secondary)]">
            Alle {guide.questionCount} Prüfungsfragen dieses Moduls direkt im
            Übungsmodus trainieren.
          </span>
        )}

        <Link
          href={practiceUrl}
          onClick={() => {
            if (onClose) onClose();
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-indigo)] hover:bg-[var(--accent-indigo-hover)] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          <span>Jetzt Modul üben →</span>
        </Link>
      </div>
    </div>
  );
}

export interface StudyGuideModalProps {
  guide: StudyGuide | null;
  open: boolean;
  onClose: () => void;
  inActivePractice?: boolean;
}

/**
 * Native <dialog> modal / slide-over drawer for displaying a StudyGuide
 * without losing current page or Practice session state.
 */
export function StudyGuideModal({
  guide,
  open,
  onClose,
  inActivePractice = false,
}: StudyGuideModalProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && guide && !dialog.open) {
      dialog.showModal();
    } else if ((!open || !guide) && dialog.open) {
      dialog.close();
    }
  }, [open, guide]);

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
      aria-labelledby={guide ? `guide-title-${guide.subcategoryId}` : undefined}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[min(94vw,52rem)] overflow-y-auto rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-8 text-[var(--ink-primary)] shadow-2xl open:block"
    >
      {guide && (
        <StudyGuideView
          guide={guide}
          onClose={onClose}
          inActivePractice={inActivePractice}
        />
      )}
    </dialog>
  );
}
