"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Layers,
  Grid,
  Compass,
  Cpu,
  Scale,
  Globe2,
  Sparkles,
  Timer,
  RotateCcw,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  BookOpen,
} from "lucide-react";
import {
  useTrainerStore,
  computeTrainerAnalytics,
} from "@/store/useTrainerStore";
import type { Category } from "@/lib/schema";

interface DashboardClientProps {
  categories: Category[];
  totalQuestions: number;
  totalSubcategories: number;
}

const CATEGORY_VISUALS: Record<
  string,
  {
    index: string;
    pastelBg: string;
    pastelInk: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }
> = {
  "cat-1": {
    index: "01",
    pastelBg: "bg-[var(--pastel-lavender)]",
    pastelInk: "text-[var(--pastel-lavender-ink)]",
    icon: Layers,
  },
  "cat-2": {
    index: "02",
    pastelBg: "bg-[var(--pastel-peach)]",
    pastelInk: "text-[var(--pastel-peach-ink)]",
    icon: Grid,
  },
  "cat-3": {
    index: "03",
    pastelBg: "bg-[var(--pastel-lime)]",
    pastelInk: "text-[var(--pastel-lime-ink)]",
    icon: Compass,
  },
  "cat-4": {
    index: "04",
    pastelBg: "bg-[var(--pastel-teal)]",
    pastelInk: "text-[var(--pastel-teal-ink)]",
    icon: Cpu,
  },
  "cat-5": {
    index: "05",
    pastelBg: "bg-[var(--pastel-lavender)]",
    pastelInk: "text-[var(--pastel-lavender-ink)]",
    icon: Scale,
  },
  "cat-6": {
    index: "06",
    pastelBg: "bg-[var(--pastel-peach)]",
    pastelInk: "text-[var(--pastel-peach-ink)]",
    icon: Globe2,
  },
};

export function DashboardClient({
  categories,
  totalQuestions,
  totalSubcategories,
}: DashboardClientProps) {
  const hasHydrated = useTrainerStore((s) => s.hasHydrated);
  const questionProgress = useTrainerStore((s) => s.questionProgress);
  const bookmarks = useTrainerStore((s) => s.bookmarks);
  const revisionFlaggedIds = useTrainerStore((s) => s.revisionFlaggedIds);
  const examHistory = useTrainerStore((s) => s.examHistory);
  const recentActivity = useTrainerStore((s) => s.recentActivity);
  const activeSession = useTrainerStore((s) => s.activeSession);
  const settings = useTrainerStore((s) => s.settings);

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

  // Top 4 study areas for the hero & spotlight cards
  const spotlightCategories = analytics.categoryStats.slice(0, 4);
  const heroCards = spotlightCategories.slice(0, 3);

  const overallProgressPercent =
    totalQuestions > 0
      ? Math.round((analytics.attemptedQuestionsCount / totalQuestions) * 100)
      : 0;

  // Continue Learning destination
  const continueHref =
    hasHydrated && activeSession && !activeSession.isSubmitted
      ? activeSession.mode === "exam"
        ? "/exam"
        : "/practice"
      : analytics.recommendedAction.href;

  const continueLabel =
    hasHydrated && activeSession && !activeSession.isSubmitted
      ? "Sitzung fortsetzen"
      : "Jetzt weiterlernen";

  // Build real sparkline path from examHistory or question attempts
  const sparklinePoints = React.useMemo(() => {
    if (!hasHydrated || examHistory.length === 0) {
      return [42, 46, 44, 52, 50, 58, 56];
    }
    const recent = [...examHistory]
      .slice(0, 7)
      .reverse()
      .map((e) => Math.max(15, Math.min(95, e.accuracyPercent)));
    while (recent.length < 4) {
      recent.unshift(analytics.overallAccuracy || 50);
    }
    return recent;
  }, [hasHydrated, examHistory, analytics.overallAccuracy]);

  return (
    <div className="space-y-9 pb-10">
      {/* Top Section Heading */}
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
            Mein Lernfortschritt
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-0.5">
            Einstellungstest &amp; Auswahlverfahren • {totalQuestions} Aufgaben in{" "}
            {categories.length} Fachbereichen ({totalSubcategories} Unterkategorien)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[var(--ink-secondary)]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-surface)] px-3 py-1.5 border border-[var(--border-subtle)]">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-teal)]" />
            <span>
              Gesamtfortschritt:{" "}
              <strong className="text-[var(--ink-primary)] tabular-nums">
                {overallProgressPercent}%
              </strong>
            </span>
          </span>
        </div>
      </div>

      {/* HERO SECTION — Inspired by reference image 2 (deep navy panel + asymmetrical pastel cards) */}
      <section
        aria-label="Lernübersicht und Hauptfächer"
        className="relative rounded-[28px] bg-[var(--surface-navy)] p-6 sm:p-8 lg:p-10 text-white shadow-sm overflow-hidden"
      >
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
          {/* Left Editorial Column inside Navy Hero */}
          <div className="xl:col-span-5 flex flex-col justify-between space-y-6 py-1">
            <div className="space-y-3">
              <p className="text-sm sm:text-base font-medium text-white/75">
                Hi, {hasHydrated ? settings.userName : "Kandidat"}!
              </p>

              <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold leading-[1.2] tracking-tight text-white">
                {analytics.attemptedQuestionsCount > 0 ? (
                  <>
                    Du hast bereits{" "}
                    <span className="text-[var(--pastel-lime)] tabular-nums">
                      {analytics.attemptedQuestionsCount} Aufgaben
                    </span>{" "}
                    erfolgreich bearbeitet!
                  </>
                ) : (
                  <>
                    Bereit für dein{" "}
                    <span className="text-[var(--pastel-lime)]">
                      Auswahlverfahren
                    </span>
                    ? Starte jetzt strukturiert.
                  </>
                )}
              </h2>

              <p className="text-xs sm:text-sm text-white/70 max-w-md leading-relaxed">
                {analytics.attemptedQuestionsCount > 0
                  ? `${analytics.masteredCount} von ${totalQuestions} Fragen gemeistert (${overallProgressPercent}% der Gesamtdatenbank). Aktuelle Trefferquote: ${analytics.overallAccuracy}%.`
                  : `Trainiere alle ${totalQuestions} offiziellen Aufgaben mit Sofort-Feedback oder simuliere eine echte Prüfung unter Zeitdruck.`}
              </p>
            </div>

            {/* Overall Progress Bar + White Pill CTA */}
            <div className="space-y-5 pt-2">
              <div className="max-w-sm space-y-1.5">
                <div className="flex items-center justify-between text-xs text-white/75">
                  <span>Gesamtdatenbank-Fortschritt</span>
                  <span className="font-mono font-semibold text-white tabular-nums">
                    {analytics.attemptedQuestionsCount} / {totalQuestions} ({overallProgressPercent}%)
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Gesamtfortschritt"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={overallProgressPercent}
                  className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden"
                >
                  <div
                    className="h-full rounded-full bg-[var(--pastel-lime)] transition-all duration-500"
                    style={{ width: `${Math.max(overallProgressPercent, 3)}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={continueHref}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1B1C30] transition-transform hover:scale-[1.02] active:scale-[0.99]"
                >
                  <span>{continueLabel}</span>
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
                </Link>

                <Link
                  href="/categories"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors"
                >
                  <span>Alle 6 Kategorien</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Pastel Study Cards inside Hero (01 Lavender, 02 Peach, 03 Soft Lime) */}
          <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
            {heroCards.map((item) => {
              const visual = CATEGORY_VISUALS[item.category.id] || CATEGORY_VISUALS["cat-1"];
              const Icon = visual.icon;
              const subCount = item.category.subcategories.length;

              return (
                <Link
                  key={item.category.id}
                  href={`/categories/${item.category.slug}`}
                  className={`group flex flex-col justify-between rounded-[22px] p-5 sm:p-6 min-h-[228px] transition-transform duration-200 hover:-translate-y-1 shadow-sm ${visual.pastelBg} ${visual.pastelInk}`}
                >
                  {/* Card Top: Number 01 + More Icon */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider opacity-80 tabular-nums">
                      {visual.index}
                    </span>
                    <MoreHorizontal className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Card Middle: Bold Geometric Icon + Category Title */}
                  <div className="my-5 space-y-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black/8">
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-[17px] font-bold leading-snug tracking-tight">
                        {item.category.titleDe}
                      </h3>
                    </div>
                  </div>

                  {/* Card Bottom: Subcategories / Questions | % + Minimal Dark Progress Line */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold opacity-80">
                      <span>
                        {subCount} Module • {item.totalQuestions} Fragen
                      </span>
                      <span className="tabular-nums">{item.completionPercent}%</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-black/15 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-current transition-all duration-300"
                        style={{
                          width: `${Math.max(item.completionPercent, 8)}%`,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ASYMMETRIC TWO-COLUMN EDITORIAL WORKSPACE — Inspired by reference image 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 cols): Statistics Row + Progress by Category */}
        <div className="lg:col-span-7 space-y-8">
          {/* Statistics Section */}
          <section aria-labelledby="dashboard-stats-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="dashboard-stats-heading"
                className="text-lg font-bold tracking-tight text-[var(--ink-primary)]"
              >
                Statistiken
              </h2>
              <Link
                href="/statistics"
                className="text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
              >
                Detailanalyse →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-12 gap-4">
              {/* Metric 1: Questions Attempted / Total */}
              <div className="col-span-1 sm:col-span-3 rounded-[22px] bg-[var(--bg-surface)] p-5 shadow-2xs border border-[var(--border-subtle)]/60 flex flex-col justify-between min-h-[138px]">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums">
                  {analytics.attemptedQuestionsCount}
                  <span className="text-sm font-medium text-[var(--ink-muted)]">
                    /{totalQuestions}
                  </span>
                </span>
                <div className="space-y-0.5 mt-4">
                  <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-snug">
                    Fragen bearbeitet
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    {analytics.masteredCount} gemeistert
                  </p>
                </div>
              </div>

              {/* Metric 2: Completed Exams */}
              <div className="col-span-1 sm:col-span-3 rounded-[22px] bg-[var(--bg-surface)] p-5 shadow-2xs border border-[var(--border-subtle)]/60 flex flex-col justify-between min-h-[138px]">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums">
                  {analytics.completedExamsCount}
                </span>
                <div className="space-y-0.5 mt-4">
                  <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-snug">
                    Prüfungen beendet
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    {analytics.completedSessionsCount} Sitzungen gesamt
                  </p>
                </div>
              </div>

              {/* Metric 3: Wide Accuracy Card with Lavender Area Sparkline (like 8.5 Hours spent in reference image 2) */}
              <div className="col-span-2 sm:col-span-6 rounded-[22px] bg-[var(--bg-surface)] p-5 shadow-2xs border border-[var(--border-subtle)]/60 flex items-center justify-between gap-4 min-h-[138px]">
                <div className="flex flex-col justify-between h-full">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-primary)] tabular-nums">
                    {analytics.attemptedQuestionsCount > 0
                      ? `${analytics.overallAccuracy}%`
                      : "—"}
                  </span>
                  <div className="space-y-0.5 mt-4">
                    <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-snug">
                      Gesamtgenauigkeit
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {analytics.attemptedQuestionsCount > 0
                        ? "Echte Auswertung"
                        : "Noch keine Versuche"}
                    </p>
                  </div>
                </div>

                {/* Smooth Lavender Sparkline SVG */}
                <div className="w-36 sm:w-44 h-20 shrink-0">
                  <svg
                    viewBox="0 0 160 70"
                    role="img"
                    aria-label="Genauigkeitsverlauf"
                    className="w-full h-full overflow-visible"
                  >
                    <defs>
                      <linearGradient id="lavenderSpark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#BFA8FF" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="#BFA8FF" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line
                      x1="0"
                      y1="18"
                      x2="160"
                      y2="18"
                      stroke="currentColor"
                      className="text-[var(--border-subtle)]"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1="38"
                      x2="160"
                      y2="38"
                      stroke="currentColor"
                      className="text-[var(--border-subtle)]"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1="58"
                      x2="160"
                      y2="58"
                      stroke="currentColor"
                      className="text-[var(--border-subtle)]"
                      strokeDasharray="3 3"
                    />
                    {(() => {
                      const stepX = 160 / (sparklinePoints.length - 1);
                      const coords = sparklinePoints.map((val, i) => ({
                        x: Math.round(i * stepX),
                        y: Math.round(62 - (val / 100) * 50),
                      }));
                      const linePath = coords
                        .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
                        .join(" ");
                      const areaPath = `${linePath} L 160 66 L 0 66 Z`;
                      return (
                        <>
                          <path d={areaPath} fill="url(#lavenderSpark)" />
                          <path
                            d={linePath}
                            fill="none"
                            stroke="#9B7EFF"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {/* Progress by Category Section (styled like "My Assignments" rows in reference image 2) */}
          <section aria-labelledby="category-progress-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="category-progress-heading"
                className="text-lg font-bold tracking-tight text-[var(--ink-primary)]"
              >
                Fortschritt nach Kategorien
              </h2>
              <Link
                href="/categories"
                className="text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
              >
                Alle anzeigen
              </Link>
            </div>

            <div className="space-y-3">
              {analytics.categoryStats.map((item) => {
                const visual =
                  CATEGORY_VISUALS[item.category.id] || CATEGORY_VISUALS["cat-1"];
                const Icon = visual.icon;

                return (
                  <div
                    key={item.category.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-[var(--bg-surface)]/85 hover:bg-[var(--bg-surface)] p-4 border border-[var(--border-subtle)]/60 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${visual.pastelBg} ${visual.pastelInk}`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/categories/${item.category.slug}`}
                          className="text-sm font-bold text-[var(--ink-primary)] hover:underline truncate block"
                        >
                          {item.category.code}. {item.category.titleDe}
                        </Link>
                        <p className="text-xs text-[var(--ink-secondary)] truncate mt-0.5">
                          {item.category.subcategories.length} Unterkategorien •{" "}
                          {item.attemptedCount} von {item.totalQuestions} bearbeitet
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                      <div className="w-28 sm:w-32 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-[var(--ink-muted)]">
                            {item.accuracyPercent !== null
                              ? `${item.accuracyPercent}% korrekt`
                              : "Neu"}
                          </span>
                          <span className="text-[var(--ink-primary)] tabular-nums">
                            {item.completionPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--accent-teal)] transition-all duration-300"
                            style={{ width: `${item.completionPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/practice?category=${item.category.id}`}
                          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-navy)] hover:text-white transition-colors"
                        >
                          Üben
                        </Link>
                        <Link
                          href={`/categories/${item.category.slug}`}
                          aria-label={`Details zu ${item.category.titleDe}`}
                          className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (5 cols): 4th Pastel Spotlight + Quick Action Modules + Recommended Next Action + Recent Activity */}
        <div className="lg:col-span-5 space-y-8">
          {/* Quick Action Modules (Section 3.5 requirement: Practice Questions, Start Mock Exam, Review Mistakes, View Progress) */}
          <section aria-labelledby="quick-actions-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="quick-actions-heading"
                className="text-lg font-bold tracking-tight text-[var(--ink-primary)]"
              >
                Schnellstart-Module
              </h2>
              <span className="text-xs text-[var(--ink-muted)]">Direktzugriff</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <Link
                href="/practice"
                className="group rounded-2xl bg-[var(--bg-surface)] p-4 border border-[var(--border-subtle)]/70 hover:border-[var(--accent-indigo)] transition-all shadow-2xs flex flex-col justify-between min-h-[116px]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--pastel-lavender)] text-[var(--pastel-lavender-ink)]">
                    <Sparkles className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--ink-muted)] group-hover:text-[var(--ink-primary)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-[var(--ink-primary)]">
                    Aufgaben üben
                  </p>
                  <p className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
                    Freies Üben mit Sofort-Feedback
                  </p>
                </div>
              </Link>

              <Link
                href="/exam"
                className="group rounded-2xl bg-[var(--bg-surface)] p-4 border border-[var(--border-subtle)]/70 hover:border-[var(--accent-teal)] transition-all shadow-2xs flex flex-col justify-between min-h-[116px]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]">
                    <Timer className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--ink-muted)] group-hover:text-[var(--ink-primary)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-[var(--ink-primary)]">
                    Prüfung starten
                  </p>
                  <p className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
                    Reale Prüfungssimulation auf Zeit
                  </p>
                </div>
              </Link>

              <Link
                href="/revision"
                className="group rounded-2xl bg-[var(--bg-surface)] p-4 border border-[var(--border-subtle)]/70 hover:border-[var(--ink-primary)] transition-all shadow-2xs flex flex-col justify-between min-h-[116px]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--pastel-peach)] text-[var(--pastel-peach-ink)]">
                    <RotateCcw className="h-4 w-4" strokeWidth={2} />
                  </span>
                  {analytics.mistakeIds.length > 0 && (
                    <span className="rounded-full bg-[var(--status-danger)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--status-danger)]">
                      {analytics.mistakeIds.length} Fehler
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-[var(--ink-primary)]">
                    Fehler wiederholen
                  </p>
                  <p className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
                    Falsche &amp; markierte Fragen üben
                  </p>
                </div>
              </Link>

              <Link
                href="/statistics"
                className="group rounded-2xl bg-[var(--bg-surface)] p-4 border border-[var(--border-subtle)]/70 hover:border-[var(--ink-primary)] transition-all shadow-2xs flex flex-col justify-between min-h-[116px]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--pastel-lime)] text-[var(--pastel-lime-ink)]">
                    <BarChart3 className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--ink-muted)] group-hover:text-[var(--ink-primary)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-[var(--ink-primary)]">
                    Lernfortschritt
                  </p>
                  <p className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
                    Stärken, Schwächen &amp; Verlauf
                  </p>
                </div>
              </Link>
            </div>
          </section>

          {/* Recommended Next Study Action — Styled directly after the "Upcoming" card in reference image 2 */}
          <section aria-labelledby="recommended-action-heading" className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2
                id="recommended-action-heading"
                className="text-lg font-bold tracking-tight text-[var(--ink-primary)]"
              >
                Empfohlener nächster Schritt
              </h2>
              <Link
                href="/practice"
                className="text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              >
                Anpassen
              </Link>
            </div>

            <Link
              href={analytics.recommendedAction.href}
              className="group flex items-center justify-between gap-4 rounded-[22px] bg-[var(--bg-surface)] p-4 sm:p-5 border border-[var(--border-subtle)]/70 shadow-2xs hover:border-[var(--ink-primary)] transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-navy)] text-[var(--pastel-lime)] shadow-xs">
                  <BookOpen className="h-6 w-6" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold text-[var(--ink-muted)]">
                    {analytics.recommendedAction.badge}
                  </span>
                  <p className="text-sm sm:text-base font-bold text-[var(--ink-primary)] truncate mt-0.5">
                    {analytics.recommendedAction.title}
                  </p>
                  <p className="text-xs text-[var(--ink-secondary)] truncate mt-0.5">
                    {analytics.recommendedAction.subtitle}
                  </p>
                </div>
              </div>

              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-canvas)] text-[var(--ink-primary)] group-hover:bg-[var(--surface-navy)] group-hover:text-white transition-colors">
                <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          </section>

          {/* Recent Activity Section — with meaningful empty state when no activity exists */}
          <section aria-labelledby="recent-activity-heading" className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2
                id="recent-activity-heading"
                className="text-lg font-bold tracking-tight text-[var(--ink-primary)]"
              >
                Letzte Aktivitäten
              </h2>
              {hasHydrated && recentActivity.length > 0 && (
                <Link
                  href="/history"
                  className="text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                >
                  Verlauf öffnen
                </Link>
              )}
            </div>

            {!hasHydrated || recentActivity.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/65 p-6 text-center space-y-3">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]">
                  <Clock className="h-5 w-5" strokeWidth={1.85} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[var(--ink-primary)]">
                    Noch keine abgeschlossenen Sitzungen
                  </p>
                  <p className="text-xs text-[var(--ink-secondary)] max-w-xs mx-auto leading-relaxed">
                    Deine absolvierten Prüfungen und Übungseinheiten erscheinen hier
                    automatisch mit echter Trefferquote.
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-center gap-2.5">
                  <Link
                    href="/practice"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <span>Übung starten</span>
                  </Link>
                  <Link
                    href="/exam"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-surface-subtle)]"
                  >
                    <span>Prüfungssimulator</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentActivity.slice(0, 4).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--bg-surface)] p-3.5 border border-[var(--border-subtle)]/60 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--pastel-teal)] text-[var(--pastel-teal-ink)]">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--ink-primary)] truncate">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-[var(--ink-secondary)] truncate">
                          {act.subtitle}
                        </p>
                      </div>
                    </div>
                    {act.accuracyPercent !== undefined && (
                      <span className="shrink-0 rounded-full bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-[11px] font-bold text-[var(--ink-primary)] tabular-nums">
                        {act.accuracyPercent}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
