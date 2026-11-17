"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Flag,
  CheckCircle2,
  XCircle,
  Play,
  Bookmark,
  Trash2,
} from "lucide-react";
import {
  useTrainerStore,
  computeTrainerAnalytics,
} from "@/store/useTrainerStore";
import { getQuestionById } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RevisionCenterPage() {
  const router = useRouter();
  const hasHydrated = useTrainerStore((s) => s.hasHydrated);
  const questionProgress = useTrainerStore((s) => s.questionProgress);
  const examHistory = useTrainerStore((s) => s.examHistory);
  const bookmarks = useTrainerStore((s) => s.bookmarks);
  const revisionFlaggedIds = useTrainerStore((s) => s.revisionFlaggedIds);
  const settings = useTrainerStore((s) => s.settings);

  const toggleRevisionFlag = useTrainerStore((s) => s.toggleRevisionFlag);
  const toggleBookmark = useTrainerStore((s) => s.toggleBookmark);
  const startSession = useTrainerStore((s) => s.startSession);

  const [activeTab, setActiveTab] = React.useState<"mistakes" | "flagged">(
    "mistakes"
  );

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

  const displayedQuestionIds =
    activeTab === "mistakes" ? analytics.mistakeIds : revisionFlaggedIds;

  const displayedQuestions = React.useMemo(
    () =>
      displayedQuestionIds
        .map((id) => getQuestionById(id))
        .filter((q): q is NonNullable<typeof q> => Boolean(q)),
    [displayedQuestionIds]
  );

  const handlePracticeAllDisplayed = () => {
    if (displayedQuestions.length === 0) return;
    startSession({
      mode: "practice",
      title:
        activeTab === "mistakes"
          ? "Fehler-Wiederholung"
          : "Markierte Fragen üben",
      subjectLabel: `${displayedQuestions.length} Wiederholungsfragen`,
      categoryId: "all",
      subcategoryId: "all",
      questionIds: displayedQuestions.map((q) => q.id),
      timeLimitSeconds: null,
    });
    router.push("/practice");
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
            Fehlertraining &amp; Wiederholung
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Wiederhole gezielt falsch beantwortete Fragen sowie Aufgaben, die du
            zur Überprüfung markiert hast.
          </p>
        </div>

        {displayedQuestions.length > 0 && (
          <Button variant="indigo" onClick={handlePracticeAllDisplayed}>
            <Play className="h-4 w-4" fill="currentColor" />
            <span>
              Alle {displayedQuestions.length} Fragen jetzt interaktiv üben
            </span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("mistakes")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-colors cursor-pointer",
            activeTab === "mistakes"
              ? "bg-[var(--surface-navy)] text-white"
              : "bg-[var(--bg-surface)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]"
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Offene Fehler ({analytics.mistakeIds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("flagged")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-colors cursor-pointer",
            activeTab === "flagged"
              ? "bg-[var(--surface-navy)] text-white"
              : "bg-[var(--bg-surface)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]"
          )}
        >
          <Flag className="h-3.5 w-3.5" />
          <span>Markierte Fragen ({revisionFlaggedIds.length})</span>
        </button>
      </div>

      {/* Content */}
      {displayedQuestions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 p-10 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-[var(--ink-primary)]">
            {activeTab === "mistakes"
              ? "Keine offenen Fehler vorhanden!"
              : "Keine Fragen für die Wiederholung markiert"}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] max-w-md mx-auto leading-relaxed">
            {activeTab === "mistakes"
              ? "Sobald du im Übungsmodus oder in einer Prüfungssimulation eine Aufgabe falsch beantwortest, landet sie automatisch hier, bis du sie im Training korrigierst."
              : "Klicke während einer Prüfung oder Übung auf „Zur Überprüfung markieren“, um schwierige Fragen hier zu sammeln."}
          </p>
          <div className="pt-2">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-navy)] px-4 py-2 text-xs font-semibold text-white"
            >
              Zum Übungsmodus
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedQuestions.map((q) => {
            const prog = questionProgress[q.id];
            const isBookmarked = bookmarks.includes(q.id);
            const isFlagged = revisionFlaggedIds.includes(q.id);

            return (
              <article
                key={q.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--bg-surface-subtle)] px-3 py-1 font-mono text-xs font-bold text-[var(--ink-primary)]">
                      [{q.id}]
                    </span>
                    <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                      {q.categoryTitleDe} • {q.subcategoryId}{" "}
                      {q.subcategoryTitleDe}
                    </span>
                    {prog && (
                      <span className="rounded-full bg-[var(--status-danger)]/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--status-danger)]">
                        {prog.incorrectCount}× falsch
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBookmark(q.id)}
                      aria-label="Lesezeichen umschalten"
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg border cursor-pointer",
                        isBookmarked
                          ? "border-[var(--accent-indigo)] bg-[var(--accent-indigo)] text-white"
                          : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)]"
                      )}
                    >
                      <Bookmark
                        className="h-3.5 w-3.5"
                        fill={isBookmarked ? "currentColor" : "none"}
                      />
                    </button>

                    {isFlagged && (
                      <button
                        type="button"
                        onClick={() => toggleRevisionFlag(q.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--status-danger)] cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Markierung lösen
                      </button>
                    )}

                    <Link
                      href={`/practice?questionId=${q.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-navy)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      <span>Jetzt lösen</span>
                    </Link>
                  </div>
                </div>

                <p className="text-base font-semibold text-[var(--ink-primary)] whitespace-pre-line">
                  {q.question}
                </p>

                <div className="rounded-xl bg-[var(--pastel-teal)]/45 border border-[var(--accent-teal)]/35 p-3.5 text-xs space-y-1">
                  <p className="font-bold text-[var(--ink-primary)]">
                    Korrekte Antwort: {q.correctAnswers.join(" | ")}
                  </p>
                  {q.explanationDe &&
                    (settings.explanationLanguage === "both" ||
                      settings.explanationLanguage === "de") && (
                      <p className="text-[var(--ink-secondary)]">
                        {q.explanationDe}
                      </p>
                    )}
                  {q.explanationAr &&
                    (settings.explanationLanguage === "both" ||
                      settings.explanationLanguage === "ar") && (
                      <p
                        dir="rtl"
                        lang="ar"
                        className="text-[var(--ink-secondary)] font-medium"
                      >
                        {q.explanationAr}
                      </p>
                    )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
