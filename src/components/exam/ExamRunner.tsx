"use client";

import * as React from "react";
import {
  Timer,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Flag,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { useTrainerStore } from "@/store/useTrainerStore";
import {
  evaluateAnswer,
  getQuestionById,
  isQuestionAnswered,
} from "@/lib/questions";
import { getGuideBySubcategoryId } from "@/lib/guides";
import { StudyGuideModal } from "@/components/guides/StudyGuideView";
import { CircularTimer } from "./CircularTimer";
import { QuestionInputRenderer } from "./QuestionInputRenderer";
import { ModalDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExamRunnerProps {
  onExitOrReset?: () => void;
  onSwitchToExamMode?: (categoryId: string, subcategoryId: string) => void;
}

const NAV_PAGE_SIZE = 12;

export function ExamRunner({
  onExitOrReset,
  onSwitchToExamMode,
}: ExamRunnerProps) {
  const activeSession = useTrainerStore((s) => s.activeSession);
  const bookmarks = useTrainerStore((s) => s.bookmarks);
  const settings = useTrainerStore((s) => s.settings);

  const setSessionAnswer = useTrainerStore((s) => s.setSessionAnswer);
  const revealPracticeAnswer = useTrainerStore((s) => s.revealPracticeAnswer);
  const setSessionIndex = useTrainerStore((s) => s.setSessionIndex);
  const toggleBookmark = useTrainerStore((s) => s.toggleBookmark);
  const toggleSessionFlag = useTrainerStore((s) => s.toggleSessionFlag);
  const tickSessionTimer = useTrainerStore((s) => s.tickSessionTimer);
  const submitActiveSession = useTrainerStore((s) => s.submitActiveSession);

  const [navFilter, setNavFilter] = React.useState<
    "all" | "bookmarked" | "unanswered"
  >("all");
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);
  const [guideDrawerOpen, setGuideDrawerOpen] = React.useState(false);
  const [navPage, setNavPage] = React.useState(0);

  // Countdown Timer Effect
  React.useEffect(() => {
    if (
      !activeSession ||
      activeSession.isSubmitted ||
      activeSession.remainingSeconds === null
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      tickSessionTimer();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    activeSession?.id,
    activeSession?.isSubmitted,
    activeSession?.remainingSeconds !== null,
    tickSessionTimer,
  ]);

  // Keep pagination synced with currentIndex when filter is "all"
  React.useEffect(() => {
    if (!activeSession) return;
    if (navFilter === "all") {
      setNavPage(Math.floor(activeSession.currentIndex / NAV_PAGE_SIZE));
    } else {
      setNavPage(0);
    }
  }, [activeSession?.currentIndex, navFilter]);

  if (!activeSession) return null;

  const totalQuestions = activeSession.questionIds.length;
  const currentQuestionId =
    activeSession.questionIds[activeSession.currentIndex];
  const currentQuestion = currentQuestionId
    ? getQuestionById(currentQuestionId)
    : undefined;

  if (!currentQuestion) return null;

  const isExamMode = activeSession.mode === "exam";
  const currentAnswer = activeSession.answers[currentQuestion.id];
  const isCurrentAnswered = isQuestionAnswered(currentAnswer);
  const isCurrentBookmarked = bookmarks.includes(currentQuestion.id);
  const isCurrentFlagged = activeSession.flaggedQuestionIds.includes(
    currentQuestion.id
  );
  const isPracticeRevealed =
    !isExamMode &&
    activeSession.revealedQuestionIds.includes(currentQuestion.id);
  const isPracticeCorrect = isPracticeRevealed
    ? evaluateAnswer(currentQuestion, currentAnswer)
    : false;
  const currentSubcategoryGuide = getGuideBySubcategoryId(
    currentQuestion.subcategoryId
  );

  // Compute answered & unanswered counts across the entire session
  const answeredCount = activeSession.questionIds.filter((qId) =>
    isQuestionAnswered(activeSession.answers[qId])
  ).length;
  const unansweredCount = totalQuestions - answeredCount;
  const completedPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Filtered indices for the right-side Question Navigator
  const filteredIndices = activeSession.questionIds
    .map((qId, idx) => ({ qId, idx }))
    .filter(({ qId }) => {
      if (navFilter === "bookmarked") return bookmarks.includes(qId);
      if (navFilter === "unanswered")
        return !isQuestionAnswered(activeSession.answers[qId]);
      return true;
    });

  const totalNavPages = Math.max(
    1,
    Math.ceil(filteredIndices.length / NAV_PAGE_SIZE)
  );
  const safeNavPage = Math.min(navPage, totalNavPages - 1);
  const visibleNavItems = filteredIndices.slice(
    safeNavPage * NAV_PAGE_SIZE,
    (safeNavPage + 1) * NAV_PAGE_SIZE
  );

  const jumpToFirstUnanswered = () => {
    const firstUnansweredIdx = activeSession.questionIds.findIndex(
      (qId) => !isQuestionAnswered(activeSession.answers[qId])
    );
    if (firstUnansweredIdx !== -1) {
      setSessionIndex(firstUnansweredIdx);
    }
    setConfirmDialogOpen(false);
  };

  const handleConfirmSubmit = () => {
    setConfirmDialogOpen(false);
    submitActiveSession();
  };

  return (
    <div className="space-y-7 pb-12">
      {/* TOP EXAM METADATA HEADER BAR — Inspired by reference image 1 (exam-reference.png) */}
      <section
        aria-label="Prüfungsstatus und Fortschritt"
        className="rounded-2xl border border-[var(--border-exam)] bg-[var(--bg-surface)] px-5 sm:px-7 py-5 shadow-2xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-5 md:gap-6">
          {/* Segment 1: Exam Type */}
          <div className="md:col-span-3 md:border-r md:border-[var(--border-exam)] md:pr-5">
            <p className="text-xs font-medium text-[var(--ink-secondary)] mb-1.5">
              Modus
            </p>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
                {isExamMode ? (
                  <Timer className="h-4 w-4" strokeWidth={1.85} />
                ) : (
                  <Sparkles className="h-4 w-4" strokeWidth={1.85} />
                )}
              </span>
              <span className="text-base sm:text-lg font-bold text-[var(--ink-primary)] truncate">
                {activeSession.title}
              </span>
            </div>
          </div>

          {/* Segment 2: Subject / Category */}
          <div className="md:col-span-3 md:border-r md:border-[var(--border-exam)] md:pr-5">
            <p className="text-xs font-medium text-[var(--ink-secondary)] mb-1.5">
              Fachbereich
            </p>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
                <BookOpen className="h-4 w-4" strokeWidth={1.85} />
              </span>
              <span className="text-base sm:text-lg font-bold text-[var(--ink-primary)] truncate">
                {activeSession.subjectLabel}
              </span>
            </div>
          </div>

          {/* Segment 3: Completed (X/Y) & Progress Bar */}
          <div className="md:col-span-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-[var(--ink-primary)] tabular-nums">
                Bearbeitet ({answeredCount}/{totalQuestions})
              </span>
              <span className="font-bold text-[var(--ink-primary)] tabular-nums">
                {completedPercent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Bearbeitungsfortschritt"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completedPercent}
              className="h-1.5 w-full rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-[var(--accent-teal)] transition-all duration-300"
                style={{ width: `${completedPercent}%` }}
              />
            </div>
          </div>

          {/* Segment 4: Practice Guide Button + Submit Exam Pill Button */}
          <div className="md:col-span-3 flex flex-wrap items-center md:justify-end gap-2">
            {!isExamMode && currentSubcategoryGuide && (
              <button
                type="button"
                onClick={() => setGuideDrawerOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--accent-indigo)]/40 bg-[var(--pastel-lavender)]/65 hover:bg-[var(--pastel-lavender)] px-4 py-2.5 text-xs font-bold text-[var(--pastel-lavender-ink)] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>📖 Regel &amp; Beispiele</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmDialogOpen(true)}
              className="w-full sm:w-auto rounded-full bg-[var(--accent-teal)] hover:bg-[var(--accent-teal-hover)] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              {isExamMode ? "Prüfung abgeben" : "Sitzung auswerten"}
            </button>
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN EXAMINATION WORKSPACE — Inspired by reference image 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (8 cols): Question Area + Options + Bottom Navigation */}
        <div className="lg:col-span-8 space-y-6">
          {/* Question Badge Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[var(--border-exam)] bg-[var(--bg-surface)] px-4 py-1.5 text-xs font-semibold text-[var(--ink-secondary)]">
                Frage: {activeSession.currentIndex + 1}
              </span>

              <span className="inline-flex items-center rounded-full bg-[var(--bg-surface-subtle)] px-3 py-1 text-[11px] font-medium text-[var(--ink-secondary)]">
                {currentQuestion.subcategoryId} •{" "}
                {currentQuestion.subcategoryTitleDe}
              </span>

              <span className="inline-flex items-center rounded-full bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)] capitalize">
                {currentQuestion.difficulty}
              </span>

              {isCurrentFlagged && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pastel-peach)] px-3 py-1 text-[11px] font-bold text-[var(--pastel-peach-ink)]">
                  <Flag className="h-3 w-3" /> Zur Überprüfung markiert
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {currentQuestion.instructionsDe && (
                <button
                  type="button"
                  onClick={() => setShowInstructions((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-indigo)] hover:underline cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>
                    {showInstructions ? "Hinweise ausblenden" : "Aufgabenhinweis"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Optional Subcategory Instructions Callout */}
          {showInstructions && currentQuestion.instructionsDe && (
            <div className="rounded-2xl border border-[var(--border-exam)] bg-[var(--bg-surface)] p-4 text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed whitespace-pre-line">
              <strong className="block text-[var(--ink-primary)] mb-1">
                Hinweis zu {currentQuestion.subcategoryTitleDe}:
              </strong>
              {currentQuestion.instructionsDe}
            </div>
          )}

          {/* Question Heading + Circular Indigo Bookmark Button */}
          <div className="flex items-start justify-between gap-4 pt-1">
            <h2 className="text-xl sm:text-2xl lg:text-[26px] font-semibold leading-[1.38] tracking-tight text-[var(--ink-primary)] whitespace-pre-line">
              {currentQuestion.question}
            </h2>

            <button
              type="button"
              onClick={() => toggleBookmark(currentQuestion.id)}
              aria-label={
                isCurrentBookmarked
                  ? "Lesezeichen für diese Frage entfernen"
                  : "Diese Frage als Lesezeichen speichern"
              }
              aria-pressed={isCurrentBookmarked}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer shadow-xs",
                isCurrentBookmarked
                  ? "bg-[var(--accent-indigo)] text-white scale-105"
                  : "border border-[var(--border-exam)] bg-[var(--accent-indigo)]/90 text-white opacity-85 hover:opacity-100"
              )}
            >
              <Bookmark
                className="h-4 w-4"
                fill={isCurrentBookmarked ? "currentColor" : "none"}
                strokeWidth={2}
              />
            </button>
          </div>

          {/* Answer Input Area (Supports multiple-choice, multi-select, text-input, boolean-choice) */}
          <div className="pt-1">
            <QuestionInputRenderer
              question={currentQuestion}
              value={currentAnswer}
              onChange={(val) => setSessionAnswer(currentQuestion.id, val)}
              showFeedback={isPracticeRevealed}
            />
          </div>

          {/* PRACTICE MODE EXCLUSIVE BAR: Immediate Feedback, Explanations & Retry */}
          {!isExamMode && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    variant="indigo"
                    disabled={!isCurrentAnswered}
                    onClick={() => revealPracticeAnswer(currentQuestion.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Antwort prüfen</span>
                  </Button>

                  {isPracticeRevealed && !isPracticeCorrect && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSessionAnswer(currentQuestion.id, "");
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Erneut versuchen</span>
                    </Button>
                  )}
                </div>

                {onSwitchToExamMode && (
                  <button
                    type="button"
                    onClick={() =>
                      onSwitchToExamMode(
                        currentQuestion.categoryId,
                        currentQuestion.subcategoryId
                      )
                    }
                    className="text-xs font-semibold text-[var(--accent-teal)] hover:underline cursor-pointer"
                  >
                    In den Prüfungsmodus wechseln →
                  </button>
                )}
              </div>

              {isPracticeRevealed && (
                <div
                  className={cn(
                    "rounded-2xl border p-4 sm:p-5 space-y-2.5",
                    isPracticeCorrect
                      ? "border-[var(--accent-teal)]/50 bg-[var(--pastel-teal)]/45"
                      : "border-[var(--status-danger)]/40 bg-[var(--status-danger)]/8"
                  )}
                >
                  <p className="text-xs sm:text-sm font-bold text-[var(--ink-primary)]">
                    {isPracticeCorrect
                      ? "✓ Sehr gut! Deine Antwort ist richtig."
                      : `✗ Nicht ganz. Richtige Antwort: ${currentQuestion.correctAnswers.join(", ")}`}
                  </p>

                  {currentQuestion.explanationDe &&
                    (settings.explanationLanguage === "both" ||
                      settings.explanationLanguage === "de") && (
                      <p className="text-xs sm:text-sm text-[var(--ink-primary)] leading-relaxed">
                        <strong>Erklärung:</strong> {currentQuestion.explanationDe}
                      </p>
                    )}

                  {currentQuestion.explanationAr &&
                    (settings.explanationLanguage === "both" ||
                      settings.explanationLanguage === "ar") && (
                      <p
                        dir="rtl"
                        lang="ar"
                        className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed font-medium"
                      >
                        {currentQuestion.explanationAr}
                      </p>
                    )}
                </div>
              )}
            </div>
          )}

          {/* BOTTOM NAVIGATION BAR — Inspired by reference image 1 */}
          <nav
            aria-label="Fragennavigation"
            className="pt-4 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={activeSession.currentIndex === 0}
                onClick={() => setSessionIndex(0)}
                className="min-w-16 rounded-lg border border-[var(--border-exam)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--ink-primary)] hover:not-disabled:border-[var(--accent-indigo)] disabled:opacity-45 cursor-pointer disabled:cursor-default transition-colors"
              >
                Erste
              </button>

              <button
                type="button"
                disabled={activeSession.currentIndex === 0}
                onClick={() => setSessionIndex(activeSession.currentIndex - 1)}
                className="min-w-16 rounded-lg border border-[var(--border-exam)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--ink-primary)] hover:not-disabled:border-[var(--accent-indigo)] disabled:opacity-45 cursor-pointer disabled:cursor-default transition-colors"
              >
                Zurück
              </button>

              <span
                aria-live="polite"
                className="inline-flex min-w-16 items-center justify-center rounded-lg bg-[var(--accent-indigo)] px-4 py-2 text-xs font-bold text-white tabular-nums shadow-xs"
              >
                {activeSession.currentIndex + 1} / {totalQuestions}
              </span>

              <button
                type="button"
                disabled={activeSession.currentIndex >= totalQuestions - 1}
                onClick={() => setSessionIndex(activeSession.currentIndex + 1)}
                className="min-w-16 rounded-lg border border-[var(--border-exam)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--ink-primary)] hover:not-disabled:border-[var(--accent-indigo)] disabled:opacity-45 cursor-pointer disabled:cursor-default transition-colors"
              >
                Weiter
              </button>

              <button
                type="button"
                disabled={activeSession.currentIndex >= totalQuestions - 1}
                onClick={() => setSessionIndex(totalQuestions - 1)}
                className="min-w-16 rounded-lg border border-[var(--border-exam)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--ink-primary)] hover:not-disabled:border-[var(--accent-indigo)] disabled:opacity-45 cursor-pointer disabled:cursor-default transition-colors"
              >
                Letzte
              </button>
            </div>

            {onExitOrReset && (
              <button
                type="button"
                onClick={onExitOrReset}
                className="text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)] underline-offset-4 hover:underline cursor-pointer"
              >
                Andere Konfiguration wählen
              </button>
            )}
          </nav>
        </div>

        {/* RIGHT COLUMN (4 cols): Circular Timer Card + Filter & Question Navigator Card */}
        <aside
          aria-label="Prüfungsuhr und Fragenübersicht"
          className="lg:col-span-4 space-y-5"
        >
          {/* Card 1: Circular Countdown Timer */}
          <CircularTimer
            remainingSeconds={activeSession.remainingSeconds}
            totalSeconds={activeSession.timeLimitSeconds}
            label="Verbleibende Zeit:"
          />

          {/* Card 2: Filters, Save for Revision & Numbered Question Navigator */}
          <div className="rounded-2xl border border-[var(--border-exam)] bg-[var(--bg-surface)] p-6 space-y-5 shadow-2xs">
            {/* Three Stacked Pill Buttons matching reference image 1 */}
            <div className="space-y-2.5 max-w-[230px] mx-auto">
              <button
                type="button"
                onClick={() =>
                  setNavFilter((f) => (f === "bookmarked" ? "all" : "bookmarked"))
                }
                aria-pressed={navFilter === "bookmarked"}
                className={cn(
                  "w-full rounded-full px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  navFilter === "bookmarked"
                    ? "bg-[var(--accent-indigo)] text-white shadow-xs"
                    : "border border-[var(--border-exam)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:border-[var(--accent-indigo)]"
                )}
              >
                Lesezeichen filtern
              </button>

              <button
                type="button"
                onClick={() =>
                  setNavFilter((f) => (f === "unanswered" ? "all" : "unanswered"))
                }
                aria-pressed={navFilter === "unanswered"}
                className={cn(
                  "w-full rounded-full px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  navFilter === "unanswered"
                    ? "bg-[var(--accent-indigo)] text-white shadow-xs"
                    : "border border-[var(--border-exam)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:border-[var(--accent-indigo)]"
                )}
              >
                Unbeantwortete ({unansweredCount})
              </button>

              <button
                type="button"
                onClick={() => toggleSessionFlag(currentQuestion.id)}
                aria-pressed={isCurrentFlagged}
                className={cn(
                  "w-full rounded-full px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  isCurrentFlagged
                    ? "border border-[var(--status-warning)] bg-[var(--pastel-peach)] text-[var(--pastel-peach-ink)]"
                    : "border border-[var(--border-exam)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:border-[var(--accent-indigo)]"
                )}
              >
                {isCurrentFlagged ? "Zur Überprüfung markiert ✓" : "Zur Überprüfung markieren"}
              </button>
            </div>

            {/* Numbered Question Navigator with < and > controls */}
            <div className="pt-2 space-y-3">
              {filteredIndices.length === 0 ? (
                <p className="text-center text-xs text-[var(--ink-muted)] py-3">
                  Keine Fragen in diesem Filter.{" "}
                  <button
                    type="button"
                    onClick={() => setNavFilter("all")}
                    className="font-semibold text-[var(--accent-indigo)] underline cursor-pointer"
                  >
                    Alle anzeigen
                  </button>
                </p>
              ) : (
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    aria-label="Vorherige Fragenseite"
                    disabled={safeNavPage === 0}
                    onClick={() => setNavPage((p) => Math.max(0, p - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-exam)] bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)] disabled:opacity-40 cursor-pointer disabled:cursor-default"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  {visibleNavItems.map(({ qId, idx }) => {
                    const isCurrent = idx === activeSession.currentIndex;
                    const isAns = isQuestionAnswered(activeSession.answers[qId]);
                    const isFlagged =
                      activeSession.flaggedQuestionIds.includes(qId);

                    return (
                      <button
                        key={qId}
                        type="button"
                        onClick={() => setSessionIndex(idx)}
                        aria-label={`Frage ${idx + 1}${
                          isCurrent
                            ? " (aktuell)"
                            : isFlagged
                              ? " (zur Überprüfung markiert)"
                              : isAns
                                ? " (beantwortet)"
                                : " (unbeantwortet)"
                        }`}
                        aria-current={isCurrent ? "step" : undefined}
                        className={cn(
                          "flex h-8 min-w-8 px-1.5 items-center justify-center rounded-md text-xs font-bold tabular-nums transition-all cursor-pointer",
                          isCurrent
                            ? "border-2 border-[var(--accent-indigo)] bg-[var(--bg-surface)] text-[var(--accent-indigo)] shadow-2xs"
                            : isFlagged
                              ? "border border-[var(--status-warning)]/60 bg-[var(--pastel-peach)] text-[var(--pastel-peach-ink)]"
                              : isAns
                                ? "border border-[var(--accent-teal)]/50 bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]"
                                : "border border-[var(--border-exam)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:border-[var(--ink-muted)]"
                        )}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    aria-label="Nächste Fragenseite"
                    disabled={safeNavPage >= totalNavPages - 1}
                    onClick={() =>
                      setNavPage((p) => Math.min(totalNavPages - 1, p + 1))
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-exam)] bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)] disabled:opacity-40 cursor-pointer disabled:cursor-default"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Compact Visual Legend */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-center gap-3 text-[11px] text-[var(--ink-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs border-2 border-[var(--accent-indigo)]" />
                  Aktuell
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[var(--pastel-teal)] border border-[var(--accent-teal)]/50" />
                  Beantwortet
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[var(--pastel-peach)]" />
                  Markiert
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs border border-[var(--border-exam)]" />
                  Offen
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* MANUAL SUBMISSION CONFIRMATION MODAL (<dialog>) */}
      <ModalDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        titleId="submit-exam-dialog-title"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]">
              {unansweredCount > 0 ? (
                <AlertTriangle className="h-5 w-5 text-[var(--status-warning)]" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </span>
            <div>
              <h2
                id="submit-exam-dialog-title"
                className="text-lg font-bold text-[var(--ink-primary)]"
              >
                {isExamMode
                  ? "Prüfung jetzt verbindlich abgeben?"
                  : "Übungssitzung abschließen?"}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-1">
                Überprüfe vor der Abgabe kurz deinen Bearbeitungsstand.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-xl bg-[var(--bg-canvas)] p-3.5 text-center border border-[var(--border-subtle)]">
            <div>
              <span className="block text-lg font-bold text-[var(--accent-teal)] tabular-nums">
                {answeredCount}
              </span>
              <span className="text-[11px] text-[var(--ink-secondary)]">
                Beantwortet
              </span>
            </div>
            <div>
              <span className="block text-lg font-bold text-[var(--ink-primary)] tabular-nums">
                {unansweredCount}
              </span>
              <span className="text-[11px] text-[var(--ink-secondary)]">
                Unbeantwortet
              </span>
            </div>
            <div>
              <span className="block text-lg font-bold text-[var(--status-warning)] tabular-nums">
                {activeSession.flaggedQuestionIds.length}
              </span>
              <span className="text-[11px] text-[var(--ink-secondary)]">
                Markiert
              </span>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="rounded-xl bg-[var(--pastel-peach)]/55 p-3 text-xs font-medium text-[var(--pastel-peach-ink)] flex items-center justify-between gap-2">
              <span>
                Du hast noch {unansweredCount} unbeantwortete{" "}
                {unansweredCount === 1 ? "Frage" : "Fragen"}.
              </span>
              <button
                type="button"
                onClick={jumpToFirstUnanswered}
                className="font-bold underline cursor-pointer shrink-0"
              >
                Zur Frage springen
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              autoFocus
              onClick={() => setConfirmDialogOpen(false)}
            >
              Weiterarbeiten
            </Button>
            <Button variant="teal" onClick={handleConfirmSubmit}>
              Jetzt abgeben &amp; auswerten
            </Button>
          </div>
        </div>
      </ModalDialog>

      {/* PRACTICE MODE SUBCATEGORY STUDY GUIDE DRAWER / MODAL */}
      {!isExamMode && (
        <StudyGuideModal
          guide={currentSubcategoryGuide || null}
          open={guideDrawerOpen}
          onClose={() => setGuideDrawerOpen(false)}
          inActivePractice={true}
        />
      )}
    </div>
  );
}
