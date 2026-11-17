"use client";

import * as React from "react";
import {
  Sun,
  Moon,
  Monitor,
  Languages,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  useTrainerStore,
  computeTrainerAnalytics,
} from "@/store/useTrainerStore";
import { getQuestionBank } from "@/lib/questions";
import { ModalDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingResetAction =
  | {
      kind: "all";
      title: string;
      answeredCount: number;
      keepBookmarks: boolean;
    }
  | {
      kind: "category";
      categoryId: string;
      title: string;
      answeredCount: number;
    }
  | {
      kind: "subcategory";
      subcategoryId: string;
      title: string;
      answeredCount: number;
    }
  | {
      kind: "revision";
      title: string;
      answeredCount: number;
    }
  | {
      kind: "history";
      title: string;
      answeredCount: number;
    };

export default function SettingsPage() {
  const bank = getQuestionBank();

  const hasHydrated = useTrainerStore((s) => s.hasHydrated);
  const settings = useTrainerStore((s) => s.settings);
  const questionProgress = useTrainerStore((s) => s.questionProgress);
  const examHistory = useTrainerStore((s) => s.examHistory);
  const bookmarks = useTrainerStore((s) => s.bookmarks);
  const revisionFlaggedIds = useTrainerStore((s) => s.revisionFlaggedIds);

  const updateSettings = useTrainerStore((s) => s.updateSettings);
  const resetAllProgress = useTrainerStore((s) => s.resetAllProgress);
  const resetCategoryProgress = useTrainerStore((s) => s.resetCategoryProgress);
  const resetSubcategoryProgress = useTrainerStore(
    (s) => s.resetSubcategoryProgress
  );
  const resetRevisionCenter = useTrainerStore((s) => s.resetRevisionCenter);
  const resetExamHistory = useTrainerStore((s) => s.resetExamHistory);

  const [savedNotice, setSavedNotice] = React.useState<string | null>(null);
  const [keepBookmarksOnFullReset, setKeepBookmarksOnFullReset] =
    React.useState(true);
  const [selectedResetCategoryId, setSelectedResetCategoryId] =
    React.useState<string>("cat-1");
  const [selectedResetSubcategoryId, setSelectedResetSubcategoryId] =
    React.useState<string>("1.1");
  const [pendingReset, setPendingReset] =
    React.useState<PendingResetAction | null>(null);

  const triggerSaved = (msg = "Einstellungen gespeichert") => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2600);
  };

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

  // Compute answered count per subcategory
  const subcategoryAttemptCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of bank.categories) {
      for (const sub of cat.subcategories) {
        let count = 0;
        if (hasHydrated) {
          for (const q of sub.questions) {
            if ((questionProgress[q.id]?.attempts || 0) > 0) {
              count++;
            }
          }
        }
        counts[sub.id] = count;
      }
    }
    return counts;
  }, [bank.categories, hasHydrated, questionProgress]);

  const selectedCategoryStat = analytics.categoryStats.find(
    (c) => c.category.id === selectedResetCategoryId
  );

  const allSubcategories = React.useMemo(
    () =>
      bank.categories.flatMap((c) =>
        c.subcategories.map((s) => ({
          ...s,
          categoryTitleDe: c.titleDe,
        }))
      ),
    [bank.categories]
  );

  const selectedSubcategoryObj = allSubcategories.find(
    (s) => s.id === selectedResetSubcategoryId
  );
  const selectedSubcategoryAttempted =
    subcategoryAttemptCounts[selectedResetSubcategoryId] || 0;

  const revisionTotalItems =
    analytics.mistakeIds.length + revisionFlaggedIds.length;

  const handleConfirmPendingReset = () => {
    if (!pendingReset) return;

    if (pendingReset.kind === "all") {
      resetAllProgress({ keepBookmarks: pendingReset.keepBookmarks });
      triggerSaved("Gesamter Fortschritt wurde zurückgesetzt");
    } else if (pendingReset.kind === "category") {
      resetCategoryProgress(pendingReset.categoryId);
      triggerSaved(`Kategorie „${pendingReset.title}“ zurückgesetzt`);
    } else if (pendingReset.kind === "subcategory") {
      resetSubcategoryProgress(pendingReset.subcategoryId);
      triggerSaved(`Modul „${pendingReset.title}“ zurückgesetzt`);
    } else if (pendingReset.kind === "revision") {
      resetRevisionCenter();
      triggerSaved("Fehlertraining & Wiederholungsliste geleert");
    } else if (pendingReset.kind === "history") {
      resetExamHistory();
      triggerSaved("Prüfungshistorie gelöscht");
    }

    setPendingReset(null);
  };

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
            Einstellungen
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Passe Darstellung, Erklärungssprache und deinen lokalen
            Lernfortschritt granular an.
          </p>
        </div>

        {savedNotice && (
          <span
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pastel-teal)] px-3.5 py-1.5 text-xs font-bold text-[var(--pastel-teal-ink)]"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> {savedNotice}
          </span>
        )}
      </div>

      {/* 1. Profile & Greeting */}
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-[var(--ink-primary)]">
          Profil &amp; Anzeige
        </h2>

        <div className="space-y-2 max-w-md">
          <label
            htmlFor="settings-username"
            className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]"
          >
            Dein Anzeigename auf dem Dashboard
          </label>
          <input
            id="settings-username"
            type="text"
            value={hasHydrated ? settings.userName : "Kandidat"}
            onChange={(e) => {
              updateSettings({ userName: e.target.value || "Kandidat" });
              triggerSaved();
            }}
            className="w-full rounded-xl border border-[var(--border-exam)] bg-[var(--bg-canvas)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-primary)]"
          />
        </div>
      </section>

      {/* 2. Three-State Color Scheme Toggle (per modern-web-guidance dark-mode-toggle) */}
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 space-y-4 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-[var(--ink-primary)]">
            Farbschema (Hell / Dunkel / System)
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Das helle Editorial-Design ist die primäre Referenzansicht. Du
            kannst jederzeit auf den abgedunkelten Modus oder die
            Systemeinstellung wechseln.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              {
                id: "light",
                label: "Hell (Empfohlen)",
                desc: "Warmes Editorial-Papier",
                icon: Sun,
              },
              {
                id: "dark",
                label: "Dunkel",
                desc: "Augenschonend bei Nacht",
                icon: Moon,
              },
              {
                id: "system",
                label: "Systemstandard",
                desc: "Folgt deinem Betriebssystem",
                icon: Monitor,
              },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = hasHydrated && settings.theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  updateSettings({ theme: item.id });
                  triggerSaved();
                }}
                aria-pressed={active}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer",
                  active
                    ? "border-[var(--accent-indigo)] bg-[var(--accent-indigo)] text-white shadow-xs"
                    : "border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
                )}
              >
                <Icon className="h-5 w-5 mb-3" />
                <div>
                  <span className="block text-sm font-bold">{item.label}</span>
                  <span
                    className={cn(
                      "block text-xs mt-0.5",
                      active ? "text-white/80" : "text-[var(--ink-secondary)]"
                    )}
                  >
                    {item.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Language & Explanations */}
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-[var(--accent-teal)]" />
          <h2 className="text-base font-bold text-[var(--ink-primary)]">
            Lösungserklärungen (Deutsch / Arabisch)
          </h2>
        </div>

        <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
          Alle Prüfungsfragen, Antwortoptionen und Bedienelemente bleiben
          originalgetreu auf Deutsch. Hier legst du fest, wie die
          Lösungserklärungen nach der Aufgabenbearbeitung angezeigt werden.
        </p>

        <div className="space-y-2.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
            Sprache der Lösungserklärungen
          </span>
          <div className="flex flex-wrap gap-2.5">
            {(
              [
                { id: "both", label: "Deutsch & Arabisch (Zweisprachig)" },
                { id: "de", label: "Nur Deutsch" },
                { id: "ar", label: "Nur Arabisch (العربية)" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  updateSettings({ explanationLanguage: opt.id });
                  triggerSaved();
                }}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer",
                  hasHydrated && settings.explanationLanguage === opt.id
                    ? "bg-[var(--surface-navy)] text-white"
                    : "border border-[var(--border-exam)] bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Granular Progress Reset Section ("Fortschritt zurücksetzen") */}
      <section
        aria-labelledby="granular-reset-heading"
        className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 space-y-6 shadow-2xs"
      >
        <div>
          <h2
            id="granular-reset-heading"
            className="text-lg font-bold text-[var(--ink-primary)]"
          >
            Fortschritt zurücksetzen
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-1 leading-relaxed">
            Setze gezielt einzelne Unterkategorien, ganze Fachbereiche, dein
            Fehlertraining, die Prüfungshistorie oder den gesamten Lernstand
            zurück.
          </p>
        </div>

        {/* 4a. Subcategory-Level Reset */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--ink-primary)]">
              1. Einzelnes Modul (Unterkategorie) zurücksetzen
            </h3>
            <span className="text-xs font-semibold text-[var(--ink-secondary)] tabular-nums">
              {selectedSubcategoryAttempted} bearbeitet
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label htmlFor="reset-subcategory-select" className="visually-hidden">
              Unterkategorie zum Zurücksetzen wählen
            </label>
            <select
              id="reset-subcategory-select"
              value={selectedResetSubcategoryId}
              onChange={(e) => setSelectedResetSubcategoryId(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--border-exam)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[var(--ink-primary)]"
            >
              {allSubcategories.map((sub) => {
                const count = subcategoryAttemptCounts[sub.id] || 0;
                return (
                  <option key={sub.id} value={sub.id}>
                    {sub.id} {sub.titleDe} ({count}/{sub.questions.length}{" "}
                    bearbeitet)
                  </option>
                );
              })}
            </select>

            <Button
              variant="outline"
              disabled={selectedSubcategoryAttempted === 0}
              onClick={() => {
                if (!selectedSubcategoryObj) return;
                setPendingReset({
                  kind: "subcategory",
                  subcategoryId: selectedSubcategoryObj.id,
                  title: `${selectedSubcategoryObj.id} ${selectedSubcategoryObj.titleDe}`,
                  answeredCount: selectedSubcategoryAttempted,
                });
              }}
              className="shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Modul zurücksetzen</span>
            </Button>
          </div>
        </div>

        {/* 4b. Category-Level Reset */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--ink-primary)]">
              2. Gesamten Fachbereich (Kategorie) zurücksetzen
            </h3>
            <span className="text-xs font-semibold text-[var(--ink-secondary)] tabular-nums">
              {selectedCategoryStat?.attemptedCount || 0} bearbeitet
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label htmlFor="reset-category-select" className="visually-hidden">
              Kategorie zum Zurücksetzen wählen
            </label>
            <select
              id="reset-category-select"
              value={selectedResetCategoryId}
              onChange={(e) => setSelectedResetCategoryId(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--border-exam)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[var(--ink-primary)]"
            >
              {analytics.categoryStats.map((item) => (
                <option key={item.category.id} value={item.category.id}>
                  {item.category.code}. {item.category.titleDe} (
                  {item.attemptedCount}/{item.totalQuestions} bearbeitet)
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              disabled={(selectedCategoryStat?.attemptedCount || 0) === 0}
              onClick={() => {
                if (!selectedCategoryStat) return;
                setPendingReset({
                  kind: "category",
                  categoryId: selectedCategoryStat.category.id,
                  title: `${selectedCategoryStat.category.code}. ${selectedCategoryStat.category.titleDe}`,
                  answeredCount: selectedCategoryStat.attemptedCount,
                });
              }}
              className="shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Kategorie zurücksetzen</span>
            </Button>
          </div>
        </div>

        {/* 4c. Independent Revision Center & Exam History Resets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 flex flex-col justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                3. Fehlertraining leeren
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-1">
                Setzt offene Fehler ({analytics.mistakeIds.length}) und
                markierte Wiederholungsfragen ({revisionFlaggedIds.length})
                zurück.
              </p>
            </div>
            <Button
              variant="outline"
              disabled={revisionTotalItems === 0}
              onClick={() =>
                setPendingReset({
                  kind: "revision",
                  title: "Fehlertraining & Markierungen",
                  answeredCount: revisionTotalItems,
                })
              }
              className="w-full justify-center"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Fehlerliste zurücksetzen ({revisionTotalItems})</span>
            </Button>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 flex flex-col justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                4. Prüfungshistorie löschen
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-1">
                Löscht alle {examHistory.length} gespeicherten Prüfungs- und
                Sitzungsprotokolle (Fragenfortschritt bleibt erhalten).
              </p>
            </div>
            <Button
              variant="outline"
              disabled={examHistory.length === 0}
              onClick={() =>
                setPendingReset({
                  kind: "history",
                  title: "Prüfungshistorie",
                  answeredCount: examHistory.length,
                })
              }
              className="w-full justify-center"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Historie leeren ({examHistory.length})</span>
            </Button>
          </div>
        </div>

        {/* 4d. Full Reset with Keep Bookmarks Option */}
        <div className="rounded-2xl border border-[var(--status-danger)]/35 bg-[var(--status-danger)]/5 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--status-danger)]">
                5. Gesamten Lernfortschritt komplett zurücksetzen
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-1 leading-relaxed">
                Setzt alle {analytics.attemptedQuestionsCount} bearbeiteten
                Fragen, sämtliche Statistiken, die Prüfungshistorie und das
                Fehlertraining auf Null zurück.
              </p>
            </div>

            <Button
              variant="danger"
              onClick={() =>
                setPendingReset({
                  kind: "all",
                  title: "Gesamter Lernfortschritt",
                  answeredCount: analytics.attemptedQuestionsCount,
                  keepBookmarks: keepBookmarksOnFullReset,
                })
              }
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4" />
              <span>Alles zurücksetzen</span>
            </Button>
          </div>

          <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-[var(--ink-primary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepBookmarksOnFullReset}
              onChange={(e) => setKeepBookmarksOnFullReset(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-exam)] cursor-pointer"
            />
            <span>
              Gespeicherte Lesezeichen ({hasHydrated ? bookmarks.length : 0})
              beim Zurücksetzen behalten
            </span>
          </label>
        </div>
      </section>

      {/* Confirmation Dialog for All Granular Reset Actions */}
      <ModalDialog
        open={Boolean(pendingReset)}
        onClose={() => setPendingReset(null)}
        titleId="reset-progress-dialog-title"
      >
        {pendingReset && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--status-danger)]/15 text-[var(--status-danger)]">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2
                  id="reset-progress-dialog-title"
                  className="text-lg font-bold text-[var(--ink-primary)]"
                >
                  {pendingReset.kind === "all"
                    ? "Gesamten Lernfortschritt wirklich löschen?"
                    : `„${pendingReset.title}“ zurücksetzen?`}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-1 leading-relaxed">
                  {pendingReset.kind === "history" ? (
                    <>
                      Es werden{" "}
                      <strong className="text-[var(--ink-primary)] tabular-nums">
                        {pendingReset.answeredCount} gespeicherte Sitzungen
                      </strong>{" "}
                      aus der Prüfungshistorie gelöscht.
                    </>
                  ) : (
                    <>
                      Dabei werden{" "}
                      <strong className="text-[var(--ink-primary)] tabular-nums">
                        {pendingReset.answeredCount}{" "}
                        {pendingReset.answeredCount === 1
                          ? "beantwortete Frage"
                          : "beantwortete Fragen"}
                      </strong>{" "}
                      zurückgesetzt.
                    </>
                  )}{" "}
                  {pendingReset.kind === "all" &&
                    (pendingReset.keepBookmarks
                      ? "Deine gespeicherten Lesezeichen bleiben erhalten."
                      : "Auch alle gespeicherten Lesezeichen werden gelöscht.")}
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
              <Button variant="danger" onClick={handleConfirmPendingReset}>
                Ja, jetzt zurücksetzen ({pendingReset.answeredCount})
              </Button>
            </div>
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
