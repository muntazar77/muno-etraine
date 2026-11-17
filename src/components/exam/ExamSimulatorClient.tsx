"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Timer,
  SlidersHorizontal,
  Play,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useTrainerStore } from "@/store/useTrainerStore";
import { buildSessionQuestions } from "@/lib/questions";
import type { Category, Difficulty } from "@/lib/schema";
import { ExamRunner } from "./ExamRunner";
import { SessionResultsView } from "./SessionResultsView";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExamSimulatorClientProps {
  categories: Category[];
}

export function ExamSimulatorClient({ categories }: ExamSimulatorClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hasHydrated = useTrainerStore((s) => s.hasHydrated);
  const activeSession = useTrainerStore((s) => s.activeSession);
  const examHistory = useTrainerStore((s) => s.examHistory);
  const settings = useTrainerStore((s) => s.settings);
  const startSession = useTrainerStore((s) => s.startSession);
  const clearActiveSession = useTrainerStore((s) => s.clearActiveSession);

  const [showConfigurator, setShowConfigurator] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] =
    React.useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<
    Difficulty | "all"
  >("all");
  const [questionCount, setQuestionCount] = React.useState<number>(30);
  const [durationMinutes, setDurationMinutes] = React.useState<number>(45);

  const activeCategoryObj = React.useMemo(
    () => categories.find((c) => c.id === selectedCategory),
    [categories, selectedCategory]
  );

  const availablePoolCount = React.useMemo(() => {
    return buildSessionQuestions({
      categoryId: selectedCategory,
      subcategoryId: selectedSubcategory,
      difficulty: selectedDifficulty,
      shuffle: false,
    }).length;
  }, [selectedCategory, selectedSubcategory, selectedDifficulty]);

  const handleLaunchExam = React.useCallback(
    (overrideParams?: {
      catId?: string;
      subId?: string;
      count?: number;
      mins?: number;
      title?: string;
      onlyQuestionIds?: string[];
    }) => {
      const catId = overrideParams?.catId ?? selectedCategory;
      const subId = overrideParams?.subId ?? selectedSubcategory;
      const count = overrideParams?.count ?? questionCount;
      const mins = overrideParams?.mins ?? durationMinutes;

      const catObj = categories.find(
        (c) => c.id === catId || c.slug === catId
      );
      const subObj = catObj?.subcategories.find(
        (s) => s.id === subId || s.slug === subId
      );

      const questions = buildSessionQuestions({
        categoryId: catObj ? catObj.id : "all",
        subcategoryId: subObj ? subObj.id : "all",
        difficulty: selectedDifficulty,
        onlyQuestionIds: overrideParams?.onlyQuestionIds,
        count,
        shuffle: true,
      });

      if (questions.length === 0) return;

      const subjectLabel = subObj
        ? subObj.titleDe
        : catObj
          ? catObj.titleDe
          : "Gesamtprüfung";

      startSession({
        mode: "exam",
        title: overrideParams?.title || "Modellprüfung",
        subjectLabel,
        categoryId: catObj ? catObj.id : "all",
        subcategoryId: subObj ? subObj.id : "all",
        questionIds: questions.map((q) => q.id),
        timeLimitSeconds: mins * 60,
      });

      setShowConfigurator(false);
    },
    [
      categories,
      selectedCategory,
      selectedSubcategory,
      selectedDifficulty,
      questionCount,
      durationMinutes,
      startSession,
    ]
  );

  // Auto-initialize a realistic Model Test when landing on /exam if no exam session exists
  React.useEffect(() => {
    if (!hasHydrated) return;

    const paramCat = searchParams.get("category");
    const paramSub = searchParams.get("subcategory");
    const paramConfig = searchParams.get("configure");

    if (paramConfig === "1") {
      setShowConfigurator(true);
      return;
    }

    if (paramCat) {
      const catObj = categories.find(
        (c) => c.id === paramCat || c.slug === paramCat
      );
      const subObj = catObj?.subcategories.find(
        (s) => s.id === paramSub || s.slug === paramSub
      );
      handleLaunchExam({
        catId: catObj?.id || "all",
        subId: subObj?.id || "all",
        count: subObj ? subObj.questions.length : 25,
        mins: subObj ? subObj.recommendedTimeMinutes : 30,
        title: "Modellprüfung",
      });
      return;
    }

    if (!activeSession || activeSession.mode !== "exam") {
      // Launch default Modellprüfung so the Exam Simulator is immediately live
      const defaultQuestions = buildSessionQuestions({
        categoryId: "cat-1",
        count: settings.defaultExamQuestionCount || 25,
        shuffle: false,
      });

      startSession({
        mode: "exam",
        title: "Modellprüfung",
        subjectLabel: "Mathematik & Rechnen",
        categoryId: "cat-1",
        subcategoryId: "all",
        questionIds: defaultQuestions.map((q) => q.id),
        timeLimitSeconds: (settings.defaultExamDurationMinutes || 30) * 60,
      });
    }
  }, [hasHydrated, searchParams]);

  if (!hasHydrated) {
    return (
      <div className="py-16 text-center text-sm text-[var(--ink-secondary)]">
        Prüfungsumgebung wird geladen…
      </div>
    );
  }

  // Completed Exam Results View
  if (
    !showConfigurator &&
    activeSession &&
    activeSession.mode === "exam" &&
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
            handleLaunchExam({
              catId: activeSession.categoryId,
              subId: activeSession.subcategoryId,
              count: mistakeIds.length,
              mins: Math.max(10, mistakeIds.length * 2),
              title: "Fehler-Nachprüfung",
              onlyQuestionIds: mistakeIds,
            });
          }}
        />
      );
    }
  }

  // Configurator View
  if (showConfigurator || !activeSession || activeSession.mode !== "exam") {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
              Prüfungssimulator konfigurieren
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] mt-1">
              Stelle deinen realistischen Einstellungstest unter echten
              Zeitbedingungen zusammen (keine Lösungshinweise vor Abgabe).
            </p>
          </div>

          {activeSession &&
            activeSession.mode === "exam" &&
            !activeSession.isSubmitted && (
              <Button
                variant="outline"
                onClick={() => setShowConfigurator(false)}
              >
                Zur laufenden Prüfung zurückkehren →
              </Button>
            )}
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() =>
              handleLaunchExam({
                catId: "all",
                subId: "all",
                count: 60,
                mins: 60,
                title: "Vollständige Hauptprüfung",
              })
            }
            className="group rounded-2xl bg-[var(--surface-navy)] p-6 text-left text-white transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="inline-flex rounded-full bg-[var(--pastel-lime)] px-3 py-1 text-[11px] font-bold text-[var(--pastel-lime-ink)]">
              Offizieller Standard
            </span>
            <h2 className="text-lg font-bold mt-4">
              Großer Auswahlverfahren-Test
            </h2>
            <p className="text-xs text-white/75 mt-1 leading-relaxed">
              60 zufällige Aufgaben quer durch alle 6 Fachbereiche • 60 Minuten
              Prüfungszeit.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              handleLaunchExam({
                catId: "cat-1",
                subId: "all",
                count: 25,
                mins: 30,
                title: "Mathematik-Intensivtest",
              })
            }
            className="group rounded-2xl bg-[var(--pastel-lavender)] p-6 text-left text-[var(--pastel-lavender-ink)] transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="inline-flex rounded-full bg-black/10 px-3 py-1 text-[11px] font-bold">
              Mathematik &amp; Rechnen
            </span>
            <h2 className="text-lg font-bold mt-4">25 Aufgaben • 30 Minuten</h2>
            <p className="text-xs opacity-80 mt-1 leading-relaxed">
              Grundrechenarten, Dreisatz, Prozent- &amp; Zinsrechnung, Brüche und
              Geometrie.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              handleLaunchExam({
                catId: "cat-2",
                subId: "all",
                count: 25,
                mins: 25,
                title: "Logik & Konzentrationstest",
              })
            }
            className="group rounded-2xl bg-[var(--pastel-peach)] p-6 text-left text-[var(--pastel-peach-ink)] transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="inline-flex rounded-full bg-black/10 px-3 py-1 text-[11px] font-bold">
              Logik &amp; Psychotechnik
            </span>
            <h2 className="text-lg font-bold mt-4">25 Aufgaben • 25 Minuten</h2>
            <p className="text-xs opacity-80 mt-1 leading-relaxed">
              Zahlenreihen, Syllogismen, Matrizentests und Merkfähigkeit unter
              Zeitdruck.
            </p>
          </button>
        </div>

        {/* Custom Exam Builder Form */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-5 w-5 text-[var(--accent-indigo)]" />
            <h2 className="text-lg font-bold text-[var(--ink-primary)]">
              Individuelle Prüfungsparameter
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Select */}
            <div className="space-y-2">
              <label
                htmlFor="exam-category-select"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]"
              >
                Fachbereich
              </label>
              <select
                id="exam-category-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory("all");
                }}
                className="w-full rounded-xl border border-[var(--border-exam)] bg-[var(--bg-canvas)] px-4 py-3 text-sm font-medium text-[var(--ink-primary)]"
              >
                <option value="all">Alle 6 Kategorien (Gemischt – 683 Fragen)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.code}. {cat.titleDe} ({cat.subcategories.length} Module)
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Select */}
            <div className="space-y-2">
              <label
                htmlFor="exam-subcategory-select"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]"
              >
                Unterkategorie
              </label>
              <select
                id="exam-subcategory-select"
                value={selectedSubcategory}
                disabled={!activeCategoryObj}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-exam)] bg-[var(--bg-canvas)] px-4 py-3 text-sm font-medium text-[var(--ink-primary)] disabled:opacity-50"
              >
                <option value="all">Alle Unterkategorien des Fachbereichs</option>
                {activeCategoryObj?.subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.id} {sub.titleDe} ({sub.questions.length} Fragen • Empf.{" "}
                    {sub.recommendedTimeMinutes} Min.)
                  </option>
                ))}
              </select>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                Fragenanzahl (Verfügbar: {availablePoolCount})
              </span>
              <div className="flex flex-wrap gap-2">
                {[10, 20, 30, 50, availablePoolCount].map((cnt, i) => {
                  const label = i === 4 ? `Alle (${cnt})` : String(cnt);
                  const active = questionCount === cnt;
                  return (
                    <button
                      key={`${cnt}-${i}`}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={cn(
                        "rounded-xl px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer",
                        active
                          ? "bg-[var(--accent-indigo)] text-white"
                          : "border border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Minutes */}
            <div className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                Prüfungszeit (Minuten)
              </span>
              <div className="flex flex-wrap gap-2">
                {[15, 20, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer",
                      durationMinutes === mins
                        ? "bg-[var(--accent-teal)] text-white"
                        : "border border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
                    )}
                  >
                    {mins} Min.
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-[var(--ink-secondary)]">
              Keine doppelten Fragen • Antworten werden beim Vor-/Zurückblättern
              gespeichert • Automatische Abgabe bei Zeitablauf.
            </p>

            <Button
              variant="teal"
              size="lg"
              disabled={availablePoolCount === 0}
              onClick={() => handleLaunchExam()}
            >
              <Play className="h-4 w-4" fill="currentColor" />
              <span>Prüfungssimulation jetzt starten</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active Examination Workspace
  return <ExamRunner onExitOrReset={() => setShowConfigurator(true)} />;
}
