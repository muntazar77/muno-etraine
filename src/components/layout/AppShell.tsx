"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Sparkles,
  Timer,
  FolderKanban,
  RotateCcw,
  Bookmark,
  History,
  BarChart3,
  Settings,
  Search,
  Menu,
  X,
  ArrowUpRight,
  Sun,
  Moon,
  BookOpenCheck,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrainerStore, computeTrainerAnalytics } from "@/store/useTrainerStore";
import { getAllQuestions, getQuestionBank } from "@/lib/questions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badgeKey?: "bookmarks" | "mistakes" | "history";
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutGrid },
  { label: "Übungsmodus", href: "/practice", icon: Sparkles },
  { label: "Prüfungssimulator", href: "/exam", icon: Timer },
  { label: "Kategorien", href: "/categories", icon: FolderKanban },
  { label: "Lernhilfen", href: "/lernhilfen", icon: GraduationCap },
  { label: "Fehlertraining", href: "/revision", icon: RotateCcw, badgeKey: "mistakes" },
  { label: "Lesezeichen", href: "/bookmarks", icon: Bookmark, badgeKey: "bookmarks" },
  { label: "Prüfungshistorie", href: "/history", icon: History, badgeKey: "history" },
  { label: "Statistiken", href: "/statistics", icon: BarChart3 },
  { label: "Einstellungen", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const mobileDialogRef = React.useRef<HTMLDialogElement>(null);

  const hasHydrated = useTrainerStore((s) => s.hasHydrated);
  const questionProgress = useTrainerStore((s) => s.questionProgress);
  const bookmarks = useTrainerStore((s) => s.bookmarks);
  const revisionFlaggedIds = useTrainerStore((s) => s.revisionFlaggedIds);
  const examHistory = useTrainerStore((s) => s.examHistory);
  const activeSession = useTrainerStore((s) => s.activeSession);
  const settings = useTrainerStore((s) => s.settings);
  const updateSettings = useTrainerStore((s) => s.updateSettings);

  // Sync settings.theme with <meta name="color-scheme"> and localStorage("color-scheme")
  React.useEffect(() => {
    if (!hasHydrated) return;
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) return;

    const value =
      settings.theme === "dark"
        ? "dark"
        : settings.theme === "light"
          ? "light"
          : "light dark";
    meta.setAttribute("content", value);
    try {
      if (settings.theme === "system") {
        localStorage.removeItem("color-scheme");
      } else {
        localStorage.setItem("color-scheme", settings.theme);
      }
    } catch {
      // Ignore storage restrictions
    }
  }, [hasHydrated, settings.theme]);

  // Manage mobile navigation drawer native <dialog>
  React.useEffect(() => {
    const dialog = mobileDialogRef.current;
    if (!dialog) return;
    if (mobileMenuOpen && !dialog.open) {
      dialog.showModal();
    } else if (!mobileMenuOpen && dialog.open) {
      dialog.close();
    }
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const analytics = React.useMemo(() => {
    if (!hasHydrated) return null;
    return computeTrainerAnalytics({
      questionProgress,
      examHistory,
      bookmarks,
      revisionFlaggedIds,
    });
  }, [hasHydrated, questionProgress, examHistory, bookmarks, revisionFlaggedIds]);

  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return { subcategories: [], questions: [] };

    const bank = getQuestionBank();
    const subcategories = bank.categories
      .flatMap((c) =>
        c.subcategories.map((s) => ({
          categoryId: c.id,
          categorySlug: c.slug,
          categoryTitleDe: c.titleDe,
          ...s,
        }))
      )
      .filter(
        (s) =>
          s.titleDe.toLowerCase().includes(q) ||
          s.titleAr.includes(q) ||
          s.id.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const questions = getAllQuestions()
      .filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.subcategoryTitleDe.toLowerCase().includes(q)
      )
      .slice(0, 5);

    return { subcategories, questions };
  }, [searchQuery]);

  const toggleThemeQuick = () => {
    const isCurrentlyDark =
      settings.theme === "dark" ||
      (settings.theme === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    updateSettings({ theme: isCurrentlyDark ? "light" : "dark" });
  };

  const getBadgeCount = (key?: NavItem["badgeKey"]): number => {
    if (!hasHydrated || !key) return 0;
    if (key === "bookmarks") return bookmarks.length;
    if (key === "history") return examHistory.length;
    if (key === "mistakes") {
      const mistakes = analytics?.mistakeIds.length || 0;
      return mistakes + revisionFlaggedIds.length;
    }
    return 0;
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      <a
        href="#main-workspace"
        className="visually-hidden focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-[var(--surface-navy)] focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Zum Hauptinhalt springen
      </a>

      {/* Desktop Left Sidebar — inspired by reference image 2 */}
      <aside
        aria-label="Hauptnavigation"
        className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:justify-between border-r border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-8 select-none"
      >
        <div>
          {/* Brand Header */}
          <div className="px-8 mb-10">
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-navy)] text-white shadow-xs transition-transform group-hover:scale-105">
                <BookOpenCheck className="h-5 w-5 text-[var(--pastel-lime)]" strokeWidth={2} />
              </span>
              <div>
                <span className="block text-lg font-bold tracking-tight text-[var(--ink-primary)] leading-none">
                  Muno<span className="font-normal text-[var(--ink-secondary)]">Trainer</span>
                </span>
                <span className="block text-[11px] font-medium text-[var(--ink-muted)] mt-1">
                  Auswahlverfahren &amp; Test
                </span>
              </div>
            </Link>
          </div>

          {/* Vertical Navigation List */}
          <nav aria-label="Primäre Seitennavigation">
            <ul role="list" className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const badgeCount = getBadgeCount(item.badgeKey);

                return (
                  <li key={item.href} className="relative">
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-[var(--ink-primary)]"
                      />
                    )}
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "mx-4 flex items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-colors",
                        isActive
                          ? "font-semibold text-[var(--ink-primary)] bg-[var(--bg-surface)]/75 shadow-2xs"
                          : "font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface-subtle)]/60"
                      )}
                    >
                      <span className="flex items-center gap-3.5">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive
                              ? "text-[var(--ink-primary)]"
                              : "text-[var(--ink-muted)]"
                          )}
                          strokeWidth={isActive ? 2.2 : 1.75}
                        />
                        <span>{item.label}</span>
                      </span>
                      {badgeCount > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                            isActive
                              ? "bg-[var(--surface-navy)] text-white"
                              : "bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)]"
                          )}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom Sidebar Footer — inspired by circular badge at bottom-left of reference image 2 */}
        <div className="px-6 pt-6 space-y-4">
          {hasHydrated && activeSession && !activeSession.isSubmitted && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--ink-muted)] mb-1">
                <span>Laufende Sitzung</span>
                <span className="inline-flex h-2 w-2 rounded-full bg-[var(--accent-teal)]" />
              </div>
              <p className="text-xs font-semibold text-[var(--ink-primary)] truncate">
                {activeSession.title}
              </p>
              <Link
                href={activeSession.mode === "exam" ? "/exam" : "/practice"}
                className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--surface-navy)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                <span>Fortsetzen</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between px-2">
            <Link
              href="/exam"
              className="group inline-flex items-center gap-3 text-sm font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-navy)] text-white transition-transform group-hover:scale-105">
                <Timer className="h-4 w-4" />
              </span>
              <span>Schnell-Prüfung</span>
            </Link>

            <button
              type="button"
              onClick={toggleThemeQuick}
              aria-label="Farbschema umschalten"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer"
            >
              {hasHydrated && settings.theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer (<dialog>) */}
      <dialog
        ref={mobileDialogRef}
        aria-label="Mobile Navigation"
        onClose={() => setMobileMenuOpen(false)}
        onClick={(e) => {
          if (e.target === mobileDialogRef.current) setMobileMenuOpen(false);
        }}
        className="m-0 h-dvh max-h-none w-[min(82vw,20rem)] max-w-none border-r border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-6 text-[var(--ink-primary)] shadow-2xl open:flex open:flex-col open:justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2.5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface-navy)] text-white">
                <BookOpenCheck className="h-4 w-4 text-[var(--pastel-lime)]" />
              </span>
              <span className="text-base font-bold text-[var(--ink-primary)]">
                MunoTrainer
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Menü schließen"
              className="rounded-lg p-2 text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav aria-label="Mobile Seitennavigation">
            <ul role="list" className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const badgeCount = getBadgeCount(item.badgeKey);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-[var(--surface-navy)] font-semibold text-white"
                          : "font-medium text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" strokeWidth={1.85} />
                        <span>{item.label}</span>
                      </span>
                      {badgeCount > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)]"
                          )}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-xs text-[var(--ink-muted)]">683 Prüfungsfragen</span>
          <button
            type="button"
            onClick={toggleThemeQuick}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-primary)]"
          >
            {hasHydrated && settings.theme === "dark" ? (
              <>
                <Sun className="h-3.5 w-3.5" /> Hell
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" /> Dunkel
              </>
            )}
          </button>
        </div>
      </dialog>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Compact Editorial Header */}
        <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)]/70 bg-[var(--bg-canvas)]/90 backdrop-blur-md px-4 sm:px-8 py-4">
          <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4">
            {/* Mobile Hamburger + Search Input */}
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Navigationsmenü öffnen"
                aria-expanded={mobileMenuOpen}
                className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-primary)]"
              >
                <Menu className="h-5 w-5" />
              </button>

              <search className="relative flex-1" aria-label="Globale Suche">
                <label htmlFor="global-question-search" className="visually-hidden">
                  Suche nach Kategorie, Thema oder Frage
                </label>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
                />
                <input
                  id="global-question-search"
                  type="search"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                  placeholder="Suche nach Themengebiet, Unterkategorie oder Frage (z. B. Dreisatz, 1.4, FISI)..."
                  className="w-full rounded-xl border border-transparent bg-[var(--bg-surface)]/80 pl-10 pr-4 py-2 text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--border-subtle)] focus:bg-[var(--bg-surface)] transition-colors"
                />

                {/* Interactive Search Dropdown */}
                {searchFocused &&
                  searchQuery.trim().length >= 2 &&
                  (searchResults.subcategories.length > 0 ||
                    searchResults.questions.length > 0) && (
                    <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-xl z-50">
                      {searchResults.subcategories.length > 0 && (
                        <div className="mb-2">
                          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                            Themenbereiche
                          </p>
                          <div className="space-y-1">
                            {searchResults.subcategories.map((sub) => (
                              <button
                                key={sub.id}
                                type="button"
                                onMouseDown={() => {
                                  setSearchQuery("");
                                  router.push(
                                    `/practice?category=${sub.categoryId}&subcategory=${sub.id}`
                                  );
                                }}
                                className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs hover:bg-[var(--bg-surface-subtle)] cursor-pointer"
                              >
                                <div>
                                  <span className="font-semibold text-[var(--ink-primary)]">
                                    {sub.id} {sub.titleDe}
                                  </span>
                                  <span className="ml-2 text-[var(--ink-muted)]">
                                    ({sub.categoryTitleDe})
                                  </span>
                                </div>
                                <span className="text-[11px] font-medium text-[var(--accent-indigo)]">
                                  {sub.questions.length} Fragen →
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.questions.length > 0 && (
                        <div>
                          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                            Fragen ({searchResults.questions.length})
                          </p>
                          <div className="space-y-1">
                            {searchResults.questions.map((q) => (
                              <button
                                key={q.id}
                                type="button"
                                onMouseDown={() => {
                                  setSearchQuery("");
                                  router.push(
                                    `/practice?category=${q.categoryId}&subcategory=${q.subcategoryId}&questionId=${q.id}`
                                  );
                                }}
                                className="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left text-xs hover:bg-[var(--bg-surface-subtle)] cursor-pointer"
                              >
                                <span className="truncate text-[var(--ink-primary)]">
                                  <strong className="font-mono text-[11px] text-[var(--ink-muted)] mr-1.5">
                                    [{q.id}]
                                  </strong>
                                  {q.question}
                                </span>
                                <span className="shrink-0 text-[11px] text-[var(--ink-muted)]">
                                  Üben
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </search>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/bookmarks"
                aria-label="Gespeicherte Lesezeichen anzeigen"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
              >
                <Bookmark className="h-4 w-4" strokeWidth={1.85} />
                {hasHydrated && bookmarks.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-indigo)] px-1 text-[10px] font-bold text-white">
                    {bookmarks.length}
                  </span>
                )}
              </Link>

              <Link
                href="/settings"
                aria-label="Einstellungen und Profil"
                className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-1.5 pr-3.5 py-1 text-sm font-medium text-[var(--ink-primary)] hover:border-[var(--ink-muted)] transition-colors"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pastel-lavender)] text-xs font-bold text-[var(--pastel-lavender-ink)]">
                  {(hasHydrated ? settings.userName : "K").slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline text-xs font-semibold">
                  {hasHydrated ? settings.userName : "Kandidat"}
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Workspace Landmark */}
        <main
          id="main-workspace"
          tabIndex={-1}
          className="flex-1 px-4 sm:px-8 py-6 sm:py-8 outline-none"
        >
          <div className="mx-auto max-w-[1360px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
