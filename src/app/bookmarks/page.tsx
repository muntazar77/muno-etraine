"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Play, Trash2, Eye, EyeOff } from "lucide-react";
import { useTrainerStore } from "@/store/useTrainerStore";
import { getQuestionBank, getQuestionById } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BookmarksPage() {
  const router = useRouter();
  const bank = getQuestionBank();

  const hasHydrated = useTrainerStore((s) => s.hasHydrated);
  const bookmarks = useTrainerStore((s) => s.bookmarks);
  const settings = useTrainerStore((s) => s.settings);
  const toggleBookmark = useTrainerStore((s) => s.toggleBookmark);
  const startSession = useTrainerStore((s) => s.startSession);

  const [selectedCat, setSelectedCat] = React.useState<string>("all");
  const [revealedIds, setRevealedIds] = React.useState<string[]>([]);

  const bookmarkedQuestions = React.useMemo(() => {
    if (!hasHydrated) return [];
    return bookmarks
      .map((id) => getQuestionById(id))
      .filter((q): q is NonNullable<typeof q> => Boolean(q))
      .filter((q) => (selectedCat === "all" ? true : q.categoryId === selectedCat));
  }, [hasHydrated, bookmarks, selectedCat]);

  const handlePracticeBookmarked = () => {
    if (bookmarkedQuestions.length === 0) return;
    startSession({
      mode: "practice",
      title: "Lesezeichen-Training",
      subjectLabel: `${bookmarkedQuestions.length} gespeicherte Fragen`,
      categoryId: selectedCat,
      subcategoryId: "all",
      questionIds: bookmarkedQuestions.map((q) => q.id),
      timeLimitSeconds: null,
    });
    router.push("/practice");
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
            Gespeicherte Lesezeichen
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Deine persönliche Merkliste für wichtige oder anspruchsvolle
            Prüfungsfragen.
          </p>
        </div>

        {bookmarkedQuestions.length > 0 && (
          <Button variant="indigo" onClick={handlePracticeBookmarked}>
            <Play className="h-4 w-4" fill="currentColor" />
            <span>
              Gespeicherte Fragen üben ({bookmarkedQuestions.length})
            </span>
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCat("all")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer",
            selectedCat === "all"
              ? "bg-[var(--surface-navy)] text-white"
              : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)]"
          )}
        >
          Alle ({hasHydrated ? bookmarks.length : 0})
        </button>

        {bank.categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCat(cat.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer",
              selectedCat === cat.id
                ? "bg-[var(--accent-indigo)] text-white"
                : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)]"
            )}
          >
            {cat.code}. {cat.titleDe}
          </button>
        ))}
      </div>

      {bookmarkedQuestions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 p-10 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--pastel-lavender)] text-[var(--pastel-lavender-ink)]">
            <Bookmark className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-[var(--ink-primary)]">
            Noch keine Lesezeichen in dieser Ansicht
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] max-w-md mx-auto leading-relaxed">
            Klicke im Prüfungs- oder Übungsmodus auf das runde Lesezeichen-Icon
            neben einer Frage, um sie hier dauerhaft zu speichern.
          </p>
          <div className="pt-2">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-navy)] px-4 py-2 text-xs font-semibold text-white"
            >
              Fragen entdecken
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarkedQuestions.map((q) => {
            const isRevealed = revealedIds.includes(q.id);
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
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleReveal(q.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] cursor-pointer"
                    >
                      {isRevealed ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Lösung verbergen
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Lösung zeigen
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleBookmark(q.id)}
                      aria-label="Lesezeichen entfernen"
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--status-danger)] cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Entfernen
                    </button>
                  </div>
                </div>

                <p className="text-base sm:text-lg font-semibold text-[var(--ink-primary)] whitespace-pre-line">
                  {q.question}
                </p>

                {q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt) => {
                      const isCorrect =
                        isRevealed &&
                        q.correctAnswers.some(
                          (a) => a.toUpperCase() === opt.key.toUpperCase()
                        );
                      return (
                        <div
                          key={opt.key}
                          className={cn(
                            "rounded-xl border px-3.5 py-2.5 text-xs font-medium flex items-center gap-3",
                            isCorrect
                              ? "border-[var(--accent-teal)] bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)] font-bold"
                              : "border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
                          )}
                        >
                          <span className="font-bold">{opt.key}.</span>
                          <span>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isRevealed && (
                  <div className="rounded-xl bg-[var(--pastel-teal)]/45 border border-[var(--accent-teal)]/35 p-4 text-xs space-y-1.5">
                    <p className="font-bold text-[var(--ink-primary)]">
                      Richtige Lösung: {q.correctAnswers.join(" | ")}
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
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
