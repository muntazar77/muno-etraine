---
name: nextjs-architecture
description: >
  Next.js App Router architecture guidelines for Muno eTrainer. Governs the src/app directory structure,
  Server vs Client Component boundaries, Zustand client stores with hydration safety, localStorage persistence,
  and zero-API local execution.
---

# Next.js App Router Architecture — Muno eTrainer

## 1. Directory Structure (`src/`)

- `src/app/`: Next.js App Router routes and layouts (Server Components by default).
  - `layout.tsx`: Root HTML shell, typography, `<meta name="color-scheme" content="light dark">`, theme FOUC prevention script, and application shell layout.
  - `page.tsx`: Dashboard view (loads static question bank metadata on server, hydrates client dashboard widgets).
  - `practice/page.tsx`: Interactive Practice configurator and immediate-feedback session runner.
  - `exam/page.tsx`: Exam Simulator configurator, active full-screen/focused examination workspace, and exam results review.
  - `categories/page.tsx` & `categories/[slug]/page.tsx`: Category & subcategory explorer with instructions, time limits, and direct launch into Practice or Timed Subcategory Exam.
  - `revision/page.tsx`: Revision Center (Mistakes queue, Retry Incorrect Answers, and Flagged for Review items).
  - `bookmarks/page.tsx`: Saved questions with category filters, explanations, and quick practice launch.
  - `history/page.tsx`: Completed exams archive with detailed score breakdown, duration, and full question-by-question review.
  - `statistics/page.tsx`: Dedicated Progress & Analytics experience (overall accuracy trend, performance by category, weakest subcategories, study activity).
  - `settings/page.tsx`: Theme preference (`system` / `light` / `dark`), default exam timer preferences, explanation language toggle (`DE` / `AR` / `Both`), data export/import, and safe progress reset.
- `src/lib/`:
  - `questions.ts`: Zod-validated question bank loader, indexing helpers, category/subcategory lookups, and answer evaluator (`multiple-choice`, `multi-select`, `boolean-choice`, `text-input`).
  - `schema.ts`: Strict Zod schemas for `questions.json` and persisted user state.
- `src/store/`:
  - `useTrainerStore.ts`: Zustand store with `persist` middleware synced to `localStorage` (`muno-etrainer-storage-v1`), safely guarded against SSR hydration mismatches.
- `src/components/`:
  - `layout/`: Sidebar, MobileDrawer, TopHeader, AppShell.
  - `dashboard/`: HeroPanel, StudyAreaCards, QuickActions, StatisticsRow, CategoryProgressList, RecentActivity, RecommendedAction.
  - `exam/`: ExamHeaderBar, QuestionWorkspace, OptionCard, TextInputQuestion, CircularTimer, QuestionNavigatorPanel, BottomExamNav, SubmitConfirmDialog, SessionResultsView.

## 2. Server vs. Client Component Rules

- **Server Components**: Use for page shells, static question-bank metadata summaries, SEO titles, and layout wrappers. Never reference `window`, `document`, or `localStorage` inside Server Components.
- **Client Components (`"use client"`)**: Use for interactive state (active exam/practice session, countdown timer, answer selection, bookmarks, filter pills, and localStorage-backed statistics).
- **Hydration Safety**: Expose a `hasHydrated` flag in the client store so Server-rendered HTML and initial Client render match cleanly without React hydration warnings.
