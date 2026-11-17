"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles,
  Timer,
  Play,
  SlidersHorizontal,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useTrainerStore, computeTrainerAnalytics } from "@/store/useTrainerStore";
import { buildSessionQuestions, getQuestionById } from "@/lib/questions";
import type { Category, Difficulty } from "@/lib/schema";
import { ExamRunner } from "./ExamRunner";
import { SessionResultsView } from "./SessionResultsView";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PracticeClientProps {
  categories: Category[];
}

export function PracticeClient({ categories }: PracticeClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hasHydrated = useTrainerStore((s) => s.hasHydrated);
  const activeSession = useTrainerStore((s) => s.activeSession);
  const examHistory = useTrainerStore((s) => s.examHistory);
  const questionProgress = useTrainerStore((s) => s.questionProgress);
  const bookmarks = useTrainerStore((s) => s.bookmarks);
  const revisionFlaggedIds = useTrainerStore((s) => s.revisionFlaggedIds);
  const startSession = useTrainerStore((s) => s.startSession);
  const clearActiveSession = useTrainerStore((s) => s.clearActiveSession);

  const [showConfigurator, setShowConfigurator] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>(
    searchParams.get("category") || "cat-1"
  );
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<string>(
    searchParams.get("subcategory") || "all"
  );
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<
    Difficulty | "all"
  >("all");
  const [questionCount, setQuestionCount] = React.useState<number>(15);
  const [useTimer, setUseTimer] = React.useState<boolean>(false);
  const [timerMinutes, setTimerMinutes] = React.useState<number>(20);

  const activeCategoryObj = React.useMemo(
    () =>
      categories.find(
        (c) => c.id === selectedCategory || c.slug === selectedCategory
      ),
    [categories, selectedCategory]
  );

  const availablePool = React.useMemo(
    () =>
      buildSessionQuestions({
        categoryId: activeCategoryObj ? activeCategoryObj.id : "all",
        subcategoryId: selectedSubcategory,
        difficulty: selectedDifficulty,
        shuffle: false,
      }),
    [activeCategoryObj, selectedSubcategory, selectedDifficulty]
  );

  const analytics = React.useMemo(() => {
    if (!hasHydrated) return null;
    return computeTrainerAnalytics({
      questionProgress,
      examHistory,
      bookmarks,
      revisionFlaggedIds,
    });
  }, [hasHydrated, questionProgress, examHistory, bookmarks, revisionFlaggedIds]);

  const launchPracticeSession = React.useCallback(
    (override?: {
      catId?: string;
      subId?: string;
      count?: number;
      timed?: boolean;
      mins?: number;
      onlyQuestionIds?: string[];
      title?: string;
    }) => {
      const catId = override?.catId ?? (activeCategoryObj?.id || "all");
      const subId = override?.subId ?? selectedSubcategory;
      const count = override?.count ?? questionCount;
      const timed = override?.timed ?? useTimer;
      const mins = override?.mins ?? timerMinutes;

      const catObj = categories.find(
        (c) => c.id === catId || c.slug === catId
      );
      const subObj = catObj?.subcategories.find(
        (s) => s.id === subId || s.slug === subId
      );

      const pool = buildSessionQuestions({
        categoryId: catObj ? catObj.id : "all",
        subcategoryId: subObj ? subObj.id : "all",
        difficulty: selectedDifficulty,
        onlyQuestionIds: override?.onlyQuestionIds,
        count,
        shuffle: !override?.onlyQuestionIds,
      });

      if (pool.length === 0) return;

      const subjectLabel = subObj
        ? `${subObj.id} ${subObj.titleDe}`
        : catObj
          ? catObj.titleDe
          : "Gemischtes Training";

      startSession({
        mode: "practice",
        title: override?.title || "Freies Training",
        subjectLabel,
        categoryId: catObj ? catObj.id : "all",
        subcategoryId: subObj ? subObj.id : "all",
        questionIds: pool.map((q) => q.id),
        timeLimitSeconds: timed ? mins * 60 : null,
      });

      setShowConfigurator(false);
    },
    [
      activeCategoryObj,
      selectedSubcategory,
      selectedDifficulty,
      questionCount,
      useTimer,
      timerMinutes,
      categories,
      startSession,
    ]
  );

  // Handle URL query parameters (?category=...&subcategory=...&questionId=...&mode=mistakes)
  React.useEffect(() => {
    if (!hasHydrated) return;

    const paramCat = searchParams.get("category");
    const paramSub = searchParams.get("subcategory");
    const paramQId = searchParams.get("questionId");
    const paramMode = searchParams.get("mode");

    if (paramMode === "mistakes" && analytics && analytics.mistakeIds.length > 0) {
      launchPracticeSession({
        catId: "all",
        subId: "all",
        onlyQuestionIds: analytics.mistakeIds,
        count: analytics.mistakeIds.length,
        title: "Fehlertraining",
      });
      return;
    }

    if (paramQId) {
      const q = getQuestionById(paramQId);
      if (q) {
        launchPracticeSession({
          catId: q.categoryId,
          subId: q.subcategoryId,
          onlyQuestionIds: [q.id],
          count: 1,
          title: `Einzelaufgabe ${q.id}`,
        });
        return;
      }
    }

    if (paramCat || paramSub) {
      let catObj = categories.find(
        (c) => c.id === paramCat || c.slug === paramCat
      );
      if (!catObj && paramSub) {
        catObj = categories.find((c) =>
          c.subcategories.some((s) => s.id === paramSub || s.slug === paramSub)
        );
      }
      const subObj = catObj?.subcategories.find(
        (s) => s.id === paramSub || s.slug === paramSub
      );
      setSelectedCategory(catObj?.id || "all");
      setSelectedSubcategory(subObj?.id || "all");
      launchPracticeSession({
        catId: catObj?.id || "all",
        subId: subObj?.id || "all",
        count: subObj ? subObj.questions.length : 15,
      });
    }
  }, [hasHydrated, searchParams]);

  if (!hasHydrated) {
    return (
      <div className="py-16 text-center text-sm text-[var(--ink-secondary)]">
        Übungsbereich wird geladen…
      </div>
    );
  }

  // Completed Practice Session Review
  if (
    !showConfigurator &&
    activeSession &&
    activeSession.mode === "practice" &&
    activeSession.isSubmitted
  ) {
    const completedRecord = examHistory.find(
      (r) => r.id === activeSession.completedRecordId
    );
    if (completedRecord) {
      return (
        <SessionResultsView
          record={completedRecord}
          onStartNew={() => {
            clearActiveSession();
            setShowConfigurator(true);
          }}
          onRetryMistakes={(mistakeIds) => {
            launchPracticeSession({
              catId: activeSession.categoryId,
              subId: activeSession.subcategoryId,
              onlyQuestionIds: mistakeIds,
              count: mistakeIds.length,
              title: "Fehler-Wiederholung",
            });
          }}
        />
      );
    }
  }

  // Active Practice Runner
  if (
    !showConfigurator &&
    activeSession &&
    activeSession.mode === "practice" &&
    !activeSession.isSubmitted
  ) {
    return (
      <ExamRunner
        onExitOrReset={() => setShowConfigurator(true)}
        onSwitchToExamMode={(catId, subId) => {
          router.push(`/exam?category=${catId}&subcategory=${subId}`);
        }}
      />
    );
  }

  // Practice Configurator
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
            Interaktives Übungstraining
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Trainiere gezielt einzelne Kategorien und Unterkategorien mit
            sofortigem Lösungs-Feedback, Erklärungen (DE/AR) und Wiederholung.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeSession &&
            activeSession.mode === "practice" &&
            !activeSession.isSubmitted && (
              <Button
                variant="outline"
                onClick={() => setShowConfigurator(false)}
              >
                Aktive Übung fortsetzen →
              </Button>
            )}
          <Button
            variant="teal"
            onClick={() =>
              router.push(
                `/exam?category=${selectedCategory}&subcategory=${selectedSubcategory}`
              )
            }
          >
            <Timer className="h-4 w-4" />
            <span>In den Prüfungsmodus wechseln</span>
          </Button>
        </div>
      </div>

      {/* Category & Subcategory Configurator Card */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-7 shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-5 w-5 text-[var(--accent-indigo)]" />
            <h2 className="text-lg font-bold text-[var(--ink-primary)]">
              Übungseinheit zusammenstellen
            </h2>
          </div>

          {analytics && analytics.mistakeIds.length > 0 && (
            <button
              type="button"
              onClick={() =>
                launchPracticeSession({
                  catId: "all",
                  subId: "all",
                  onlyQuestionIds: analytics.mistakeIds,
                  count: analytics.mistakeIds.length,
                  title: "Fehler wiederholen",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pastel-peach)] px-4 py-1.5 text-xs font-bold text-[var(--pastel-peach-ink)] hover:opacity-90 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>
                {analytics.mistakeIds.length} falsche Antworten jetzt wiederholen
              </span>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="space-y-2.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
            1. Kategorie wählen
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const qTotal = cat.subcategories.reduce(
                (acc, s) => acc + s.questions.length,
                0
              );
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubcategory("all");
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-[var(--accent-indigo)] bg-[var(--accent-indigo)] text-white shadow-xs"
                      : "border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)] hover:border-[var(--accent-indigo)]/60"
                  )}
                >
                  <div>
                    <span className="block text-sm font-bold">
                      {cat.code}. {cat.titleDe}
                    </span>
                    <span
                      className={cn(
                        "block text-xs mt-0.5",
                        isSelected ? "text-white/80" : "text-[var(--ink-secondary)]"
                      )}
                    >
                      {cat.subcategories.length} Unterkategorien • {qTotal} Fragen
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subcategory Selector */}
        {activeCategoryObj && (
          <div className="space-y-2.5">
            <label
              htmlFor="practice-subcategory"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]"
            >
              2. Unterkategorie
            </label>
            <select
              id="practice-subcategory"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-exam)] bg-[var(--bg-canvas)] px-4 py-3 text-sm font-semibold text-[var(--ink-primary)]"
            >
              <option value="all">
                Alle {activeCategoryObj.subcategories.length} Unterkategorien aus{" "}
                {activeCategoryObj.titleDe}
              </option>
              {activeCategoryObj.subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.id} {sub.titleDe} ({sub.questions.length} Aufgaben •{" "}
                  {sub.recommendedTimeMinutes} Min. Richtzeit)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Question Count, Difficulty & Optional Timer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
              3. Fragenanzahl ({availablePool.length} verfügbar)
            </span>
            <div className="flex flex-wrap gap-2">
              {[10, 15, 25, availablePool.length].map((cnt, idx) => {
                const label = idx === 3 ? `Alle (${cnt})` : String(cnt);
                return (
                  <button
                    key={`${cnt}-${idx}`}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={cn(
                      "rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer",
                      questionCount === cnt
                        ? "bg-[var(--surface-navy)] text-white"
                        : "border border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
              4. Schwierigkeitsgrad
            </span>
            <div className="flex flex-wrap gap-2">
              {(["all", "leicht", "mittel", "schwer"] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-xs font-bold capitalize transition-colors cursor-pointer",
                    selectedDifficulty === diff
                      ? "bg-[var(--surface-navy)] text-white"
                      : "border border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
                  )}
                >
                  {diff === "all" ? "Alle" : diff}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
              5. Zeitmodus
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUseTimer(false)}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer",
                  !useTimer
                    ? "bg-[var(--accent-teal)] text-white"
                    : "border border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
                )}
              >
                Ohne Zeitlimit
              </button>
              <button
                type="button"
                onClick={() => setUseTimer(true)}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer",
                  useTimer
                    ? "bg-[var(--accent-teal)] text-white"
                    : "border border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
                )}
              >
                Mit Timer ({timerMinutes} Min.)
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[var(--ink-secondary)]">
            Im Übungsmodus kannst du jede Antwort sofort prüfen, Erklärungen lesen
            und falsche Versuche direkt korrigieren.
          </p>

          <Button
            variant="indigo"
            size="lg"
            disabled={availablePool.length === 0}
            onClick={() => launchPracticeSession()}
          >
            <Play className="h-4 w-4" fill="currentColor" />
            <span>
              Übung starten ({Math.min(questionCount, availablePool.length)} Fragen)
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
