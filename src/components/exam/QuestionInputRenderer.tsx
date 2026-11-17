"use client";

import * as React from "react";
import { Check, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedQuestion } from "@/lib/schema";
import {
  evaluateAnswer,
  getGeometryBlankLabels,
  isOperatorBlankQuestion,
} from "@/lib/questions";

interface QuestionInputRendererProps {
  question: EnrichedQuestion;
  value: string | string[] | undefined;
  onChange: (nextValue: string | string[]) => void;
  disabled?: boolean;
  /** Only true in Practice Mode after user clicks "Antwort prüfen" or in post-submission review */
  showFeedback?: boolean;
}

const OPERATORS = ["+", "-", "×", "÷"] as const;

export function QuestionInputRenderer({
  question,
  value,
  onChange,
  disabled = false,
  showFeedback = false,
}: QuestionInputRendererProps) {
  const isOpBlank = React.useMemo(
    () => isOperatorBlankQuestion(question),
    [question]
  );
  const geometryLabels = React.useMemo(
    () => getGeometryBlankLabels(question),
    [question]
  );

  // 1. Multiple-Choice & Boolean-Choice (Single Selection)
  if (question.type === "multiple-choice" || question.type === "boolean-choice") {
    const selectedKey = Array.isArray(value) ? value[0] : value || "";

    return (
      <div
        role="radiogroup"
        aria-label="Antwortmöglichkeiten"
        className="space-y-3.5"
      >
        {question.options.map((opt) => {
          const isSelected = selectedKey.toUpperCase() === opt.key.toUpperCase();
          const isCorrectOption = question.correctAnswers.some(
            (a) => a.toUpperCase() === opt.key.toUpperCase()
          );

          let feedbackStyles = "";
          if (showFeedback) {
            if (isCorrectOption) {
              feedbackStyles =
                "border-[var(--accent-teal)] bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]";
            } else if (isSelected && !isCorrectOption) {
              feedbackStyles =
                "border-[var(--status-danger)] bg-[var(--status-danger)]/12 text-[var(--ink-primary)]";
            }
          }

          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(opt.key)}
              className={cn(
                "group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition-all cursor-pointer",
                !showFeedback &&
                  (isSelected
                    ? "border-[var(--accent-indigo)] bg-[var(--accent-indigo)] text-white shadow-sm"
                    : "border-[var(--border-exam)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:not-disabled:border-[var(--accent-indigo)]/60 hover:not-disabled:bg-[var(--bg-surface-subtle)]/40"),
                showFeedback &&
                  (feedbackStyles ||
                    "border-[var(--border-exam)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] opacity-75"),
                disabled && "cursor-default"
              )}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-colors",
                    !showFeedback && isSelected
                      ? "border-white bg-white text-[#161722]"
                      : showFeedback && isCorrectOption
                        ? "border-[var(--accent-teal)] bg-[var(--accent-teal)] text-white"
                        : "border-[var(--border-exam)] bg-[var(--bg-surface)] text-[var(--ink-primary)] group-hover:border-[var(--accent-indigo)]/50"
                  )}
                >
                  {opt.key}
                </span>
                <span className="text-sm sm:text-base font-medium leading-snug">
                  {opt.text}
                </span>
              </div>

              {showFeedback && isCorrectOption && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-teal)]" />
              )}
              {showFeedback && isSelected && !isCorrectOption && (
                <XCircle className="h-5 w-5 shrink-0 text-[var(--status-danger)]" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Multi-Select (Multiple Correct Options)
  if (question.type === "multi-select") {
    const selectedKeys: string[] = Array.isArray(value)
      ? value
      : value
        ? value.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    const toggleKey = (key: string) => {
      const upper = key.toUpperCase();
      const exists = selectedKeys.some((k) => k.toUpperCase() === upper);
      const next = exists
        ? selectedKeys.filter((k) => k.toUpperCase() !== upper)
        : [...selectedKeys, key];
      onChange(next);
    };

    return (
      <div className="space-y-3.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-indigo)]">
          Mehrfachauswahl • Wähle alle zutreffenden Aussagen aus
        </p>

        <div role="group" aria-label="Mehrfachauswahl-Antworten" className="space-y-3">
          {question.options.map((opt) => {
            const isSelected = selectedKeys.some(
              (k) => k.toUpperCase() === opt.key.toUpperCase()
            );
            const isCorrectOption = question.correctAnswers.some(
              (a) => a.toUpperCase() === opt.key.toUpperCase()
            );

            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => toggleKey(opt.key)}
                className={cn(
                  "group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition-all cursor-pointer",
                  !showFeedback &&
                    (isSelected
                      ? "border-[var(--accent-indigo)] bg-[var(--accent-indigo)] text-white shadow-sm"
                      : "border-[var(--border-exam)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:not-disabled:border-[var(--accent-indigo)]/60"),
                  showFeedback &&
                    (isCorrectOption
                      ? "border-[var(--accent-teal)] bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]"
                      : isSelected
                        ? "border-[var(--status-danger)] bg-[var(--status-danger)]/12 text-[var(--ink-primary)]"
                        : "border-[var(--border-exam)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] opacity-75")
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-sm font-bold",
                      !showFeedback && isSelected
                        ? "border-white bg-white text-[#161722]"
                        : "border-[var(--border-exam)] bg-[var(--bg-surface)] text-[var(--ink-primary)]"
                    )}
                  >
                    {opt.key}
                  </span>
                  <span className="text-sm sm:text-base font-medium leading-snug">
                    {opt.text}
                  </span>
                </div>

                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                    isSelected
                      ? "border-white bg-white text-[var(--accent-indigo)]"
                      : "border-[var(--border-exam)] bg-transparent"
                  )}
                >
                  {isSelected && <Check className="h-4 w-4" strokeWidth={2.5} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Text-Input Questions
  const rawString = Array.isArray(value) ? value.join(" | ") : value || "";
  const isTextCorrect = showFeedback ? evaluateAnswer(question, rawString) : false;

  // 3a. Subcategory 1.3 Operator Blank Questions ("16 ___ 13 ___ 3 = 6")
  if (isOpBlank) {
    const parts = rawString.split(",").map((s) => s.trim());
    const op1 = parts[0] || "";
    const op2 = parts[1] || "";

    const updateOperator = (slot: 0 | 1, op: string) => {
      const next1 = slot === 0 ? op : op1;
      const next2 = slot === 1 ? op : op2;
      onChange(`${next1}, ${next2}`);
    };

    return (
      <div className="space-y-5 rounded-2xl border border-[var(--border-exam)] bg-[var(--bg-surface)] p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[0, 1].map((slotIdx) => {
            const currentOp = slotIdx === 0 ? op1 : op2;
            return (
              <div key={slotIdx} className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                  {slotIdx + 1}. Rechenzeichen (Lücke {slotIdx + 1})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {OPERATORS.map((op) => {
                    const active = currentOp === op;
                    return (
                      <button
                        key={op}
                        type="button"
                        disabled={disabled}
                        onClick={() => updateOperator(slotIdx as 0 | 1, op)}
                        className={cn(
                          "h-12 rounded-xl border text-lg font-bold transition-all cursor-pointer",
                          active
                            ? "border-[var(--accent-indigo)] bg-[var(--accent-indigo)] text-white shadow-xs"
                            : "border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)] hover:not-disabled:border-[var(--accent-indigo)]"
                        )}
                      >
                        {op}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[var(--ink-secondary)]">
            Ausgewählte Kombination:{" "}
            <strong className="font-mono text-sm text-[var(--ink-primary)]">
              {op1 || "_"} , {op2 || "_"}
            </strong>
          </div>
          {showFeedback && (
            <div className="text-xs font-semibold">
              {isTextCorrect ? (
                <span className="text-[var(--accent-teal)]">
                  ✓ Korrekt ({question.correctAnswers[0]})
                </span>
              ) : (
                <span className="text-[var(--status-danger)]">
                  ✗ Richtige Lösung: {question.correctAnswers[0]}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3b. Subcategory 1.9 Multi-Field Geometry Blanks (e.g. "Seite b", "Flächeninhalt")
  if (geometryLabels.length > 0) {
    // Parse existing value "Seite b: 10 | Flächeninhalt: 60" into a map
    const currentValues: Record<string, string> = {};
    rawString.split("|").forEach((segment) => {
      const idx = segment.indexOf(":");
      if (idx !== -1) {
        const k = segment.slice(0, idx).trim();
        const v = segment.slice(idx + 1).trim();
        currentValues[k] = v;
      }
    });

    const handleFieldChange = (label: string, fieldVal: string) => {
      const nextMap = { ...currentValues, [label]: fieldVal };
      const serialized = geometryLabels
        .map((lbl) => `${lbl}: ${nextMap[lbl] ?? ""}`)
        .join(" | ");
      onChange(serialized);
    };

    return (
      <div className="space-y-4 rounded-2xl border border-[var(--border-exam)] bg-[var(--bg-surface)] p-5 sm:p-6">
        <p className="text-xs font-semibold text-[var(--ink-secondary)]">
          Trage die berechneten Werte in die jeweiligen Felder ein:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {geometryLabels.map((label, idx) => {
            const inputId = `geo-field-${question.id}-${idx}`;
            return (
              <div key={label} className="space-y-1.5">
                <label
                  htmlFor={inputId}
                  className="block text-xs font-bold text-[var(--ink-primary)]"
                >
                  {label}
                </label>
                <input
                  id={inputId}
                  type="text"
                  inputMode="decimal"
                  disabled={disabled}
                  value={currentValues[label] ?? ""}
                  onChange={(e) => handleFieldChange(label, e.target.value)}
                  placeholder="Wert eingeben..."
                  className="w-full rounded-xl border border-[var(--border-exam)] bg-[var(--bg-canvas)] px-4 py-3 font-mono text-base text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-indigo)] focus:bg-[var(--bg-surface)]"
                />
              </div>
            );
          })}
        </div>

        {showFeedback && (
          <div
            className={cn(
              "mt-3 rounded-xl p-3 text-xs font-semibold",
              isTextCorrect
                ? "bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]"
                : "bg-[var(--status-danger)]/12 text-[var(--status-danger)]"
            )}
          >
            {isTextCorrect
              ? `✓ Alle Werte korrekt (${question.correctAnswers[0]})`
              : `✗ Richtige Lösung: ${question.correctAnswers[0]}`}
          </div>
        )}
      </div>
    );
  }

  // 3c. Standard Numeric / Fraction / Equation Input
  const inputId = `text-answer-${question.id}`;
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border-exam)] bg-[var(--bg-surface)] p-5 sm:p-6">
      <label
        htmlFor={inputId}
        className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]"
      >
        Deine Antwort eingeben
      </label>
      <p id={`${inputId}-hint`} className="text-xs text-[var(--ink-muted)]">
        Zahlen ohne Tausenderpunkt eingeben (z. B.{" "}
        <code className="font-mono">14042</code>, Dezimalzahlen mit Komma{" "}
        <code className="font-mono">30397,19</code>, Brüche als{" "}
        <code className="font-mono">17/10</code>).
      </p>
      <input
        id={inputId}
        type="text"
        aria-describedby={`${inputId}-hint`}
        disabled={disabled}
        value={rawString}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ergebnis hier eintragen..."
        className={cn(
          "w-full rounded-xl border px-4 py-3.5 font-mono text-lg font-semibold text-[var(--ink-primary)] placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-[var(--ink-muted)] transition-colors",
          !showFeedback &&
            "border-[var(--border-exam)] bg-[var(--bg-canvas)] focus:border-[var(--accent-indigo)] focus:bg-[var(--bg-surface)]",
          showFeedback &&
            (isTextCorrect
              ? "border-[var(--accent-teal)] bg-[var(--pastel-teal)]/50"
              : "border-[var(--status-danger)] bg-[var(--status-danger)]/10")
        )}
      />

      {showFeedback && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold",
            isTextCorrect
              ? "bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]"
              : "bg-[var(--status-danger)]/12 text-[var(--status-danger)]"
          )}
        >
          {isTextCorrect ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Korrekt! Lösung: {question.correctAnswers.join(" oder ")}</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 shrink-0" />
              <span>Richtige Lösung: {question.correctAnswers.join(" oder ")}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
