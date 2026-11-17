"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  BookOpen,
  Clock,
  Lightbulb,
  AlertTriangle,
  Layers,
  Grid,
  Compass,
  Cpu,
  Scale,
  Globe2,
  X,
} from "lucide-react";
import type { Category, StudyGuide } from "@/lib/schema";
import { StudyGuideModal } from "./StudyGuideView";
import { cn } from "@/lib/utils";

interface LernhilfenClientProps {
  guides: StudyGuide[];
  categories: Category[];
}

const CATEGORY_BADGE_STYLES: Record<
  string,
  {
    pastelBg: string;
    pastelInk: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }
> = {
  "cat-1": {
    pastelBg: "bg-[var(--pastel-lavender)]",
    pastelInk: "text-[var(--pastel-lavender-ink)]",
    icon: Layers,
  },
  "cat-2": {
    pastelBg: "bg-[var(--pastel-peach)]",
    pastelInk: "text-[var(--pastel-peach-ink)]",
    icon: Grid,
  },
  "cat-3": {
    pastelBg: "bg-[var(--pastel-lime)]",
    pastelInk: "text-[var(--pastel-lime-ink)]",
    icon: Compass,
  },
  "cat-4": {
    pastelBg: "bg-[var(--pastel-teal)]",
    pastelInk: "text-[var(--pastel-teal-ink)]",
    icon: Cpu,
  },
  "cat-5": {
    pastelBg: "bg-[var(--pastel-lavender)]",
    pastelInk: "text-[var(--pastel-lavender-ink)]",
    icon: Scale,
  },
  "cat-6": {
    pastelBg: "bg-[var(--pastel-peach)]",
    pastelInk: "text-[var(--pastel-peach-ink)]",
    icon: Globe2,
  },
};

export function LernhilfenClient({ guides, categories }: LernhilfenClientProps) {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeGuideId, setActiveGuideId] = React.useState<string | null>(null);

  // Sync URL query params (?category=...&subcategory=...)
  React.useEffect(() => {
    const paramCat = searchParams.get("category");
    const paramSub = searchParams.get("subcategory");

    if (paramCat) {
      const foundCat = categories.find(
        (c) => c.id === paramCat || c.slug === paramCat
      );
      if (foundCat) setSelectedCategory(foundCat.id);
    }

    if (paramSub) {
      const foundGuide = guides.find(
        (g) => g.subcategoryId === paramSub || g.slug === paramSub
      );
      if (foundGuide) {
        setActiveGuideId(foundGuide.subcategoryId);
      }
    }
  }, [searchParams, categories, guides]);

  const filteredGuides = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return guides.filter((g) => {
      if (selectedCategory !== "all" && g.categoryId !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        g.subcategoryId.toLowerCase().includes(q) ||
        g.titleDe.toLowerCase().includes(q) ||
        g.titleAr.includes(q) ||
        g.categoryTitleDe.toLowerCase().includes(q) ||
        g.coreRuleDe.toLowerCase().includes(q) ||
        g.coreRuleAr.includes(q)
      );
    });
  }, [guides, selectedCategory, searchQuery]);

  const activeGuide = React.useMemo(
    () => guides.find((g) => g.subcategoryId === activeGuideId) || null,
    [guides, activeGuideId]
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-indigo)]">
            Kompendium &amp; Lösungsstrategien
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-primary)] mt-0.5">
            Lernhilfen &amp; Rechenregeln (32 Module)
          </h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1 max-w-2xl">
            Kompakte Kurzregeln, Schritt-für-Schritt-Methoden, typische
            Prüfungsfallen und 64 vorgerechnete Musterbeispiele auf Deutsch und
            Arabisch für alle 32 Unterkategorien.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-5 shadow-2xs">
        <search aria-label="Lernhilfen durchsuchen">
          <div className="relative">
            <label htmlFor="lernhilfen-search-input" className="visually-hidden">
              Nach Thema, Modulnummer oder Regel suchen
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
            />
            <input
              id="lernhilfen-search-input"
              type="search"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nach Modul (z. B. 1.4, Dreisatz, Prozentrechnung, Syllogismen, IP) oder Begriff suchen..."
              className="w-full rounded-2xl border border-[var(--border-exam)] bg-[var(--bg-canvas)] pl-11 pr-10 py-3 text-sm font-medium text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-indigo)] focus:bg-[var(--bg-surface)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Suchfeld leeren"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </search>

        {/* Category Filter Pills (All 6 Main Categories) */}
        <div
          role="group"
          aria-label="Nach Fachbereich filtern"
          className="flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold transition-colors cursor-pointer",
              selectedCategory === "all"
                ? "bg-[var(--surface-navy)] text-white"
                : "border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            )}
          >
            Alle Fachbereiche ({guides.length})
          </button>

          {categories.map((cat) => {
            const count = guides.filter((g) => g.categoryId === cat.id).length;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold transition-colors cursor-pointer",
                  active
                    ? "bg-[var(--accent-indigo)] text-white"
                    : "border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                )}
              >
                {cat.code}. {cat.titleDe} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Grid */}
      {filteredGuides.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 p-10 text-center space-y-3">
          <p className="text-base font-bold text-[var(--ink-primary)]">
            Keine passende Lernhilfe gefunden
          </p>
          <p className="text-xs text-[var(--ink-secondary)]">
            Setze den Suchbegriff oder den Kategorie-Filter zurück, um alle 32
            Module anzuzeigen.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-navy)] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
          >
            Alle 32 Lernhilfen anzeigen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuides.map((guide) => {
            const style =
              CATEGORY_BADGE_STYLES[guide.categoryId] ||
              CATEGORY_BADGE_STYLES["cat-1"];
            const Icon = style.icon;
            const practiceUrl = `/practice?category=${guide.categoryId}&subcategory=${guide.subcategoryId}`;

            return (
              <article
                key={guide.id}
                className="flex flex-col justify-between rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xs space-y-5 hover:border-[var(--ink-muted)]/60 transition-colors"
              >
                <div className="space-y-4">
                  {/* Top Badge Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                          style.pastelBg,
                          style.pastelInk
                        )}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-[var(--surface-navy)] px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                            {guide.subcategoryId}
                          </span>
                          <span className="text-[11px] font-semibold text-[var(--ink-muted)] truncate">
                            {guide.categoryTitleDe}
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-[var(--ink-primary)] mt-1 leading-snug">
                          {guide.titleDe}
                        </h2>
                        <p
                          dir="rtl"
                          lang="ar"
                          className="text-xs sm:text-sm font-bold text-[var(--accent-indigo)] mt-0.5"
                        >
                          {guide.titleAr}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-[11px] font-bold text-[var(--ink-secondary)] shrink-0 tabular-nums">
                      <Clock className="h-3 w-3" /> {guide.recommendedTimeMinutes}{" "}
                      Min.
                    </span>
                  </div>

                  {/* Goldene Regel Cheat-Sheet Preview (DE + AR) */}
                  <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="inline-flex items-center gap-1.5 text-[var(--ink-primary)]">
                        <Lightbulb className="h-3.5 w-3.5 text-[var(--accent-teal)]" />
                        <span>Goldene Regel</span>
                      </span>
                      <span
                        dir="rtl"
                        lang="ar"
                        className="text-[var(--ink-secondary)]"
                      >
                        القاعدة الذهبية
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-[var(--ink-primary)] leading-relaxed">
                      {guide.coreRuleDe}
                    </p>

                    <p
                      dir="rtl"
                      lang="ar"
                      className="text-xs sm:text-sm font-medium text-[var(--ink-secondary)] leading-relaxed border-t border-[var(--border-subtle)] pt-2"
                    >
                      {guide.coreRuleAr}
                    </p>
                  </div>

                  {/* Quick Summary Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--ink-secondary)]">
                    <span className="rounded-lg bg-[var(--pastel-lavender)]/60 px-2.5 py-1 text-[var(--pastel-lavender-ink)]">
                      {guide.steps.length} Lösungsschritte
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--pastel-peach)]/60 px-2.5 py-1 text-[var(--pastel-peach-ink)]">
                      <AlertTriangle className="h-3 w-3" />
                      {guide.examTraps.length} Prüfungsfallen
                    </span>
                    <span className="rounded-lg bg-[var(--pastel-teal)]/60 px-2.5 py-1 text-[var(--pastel-teal-ink)]">
                      {guide.examples.length} Gelöste Beispiele
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveGuideId(guide.subcategoryId)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2 text-xs font-bold text-[var(--ink-primary)] hover:bg-[var(--surface-navy)] hover:text-white transition-colors cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Regel &amp; {guide.examples.length} Beispiele öffnen</span>
                  </button>

                  <Link
                    href={practiceUrl}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-indigo)] hover:bg-[var(--accent-indigo-hover)] px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    <span>Jetzt Modul üben →</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Full Study Guide Detail Modal / Drawer */}
      <StudyGuideModal
        guide={activeGuide}
        open={Boolean(activeGuide)}
        onClose={() => setActiveGuideId(null)}
      />
    </div>
  );
}
