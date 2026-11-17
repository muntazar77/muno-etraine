"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  evaluateAnswer,
  getAllQuestions,
  getQuestionBank,
  getQuestionById,
  isQuestionAnswered,
} from "@/lib/questions";

export type SessionMode = "exam" | "practice";

export interface QuestionProgress {
  questionId: string;
  attempts: number;
  correctCount: number;
  incorrectCount: number;
  lastAnswer: string | string[];
  lastCorrect: boolean;
  lastAttemptedAt: string;
}

export interface CompletedExamQuestionResult {
  questionId: string;
  userAnswer: string | string[] | null;
  isAnswered: boolean;
  isCorrect: boolean;
  flaggedForRevision: boolean;
}

export interface CompletedExamRecord {
  id: string;
  title: string;
  mode: SessionMode;
  categoryId: string | "all";
  subcategoryId: string | "all";
  subjectLabel: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  timeLimitSeconds: number | null;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  accuracyPercent: number;
  passed: boolean;
  results: CompletedExamQuestionResult[];
}

export interface StudyActivityItem {
  id: string;
  type: "exam_completed" | "practice_completed" | "question_practiced" | "revision_resolved";
  title: string;
  subtitle: string;
  timestamp: string;
  accuracyPercent?: number;
  categoryId?: string;
  sessionId?: string;
}

export interface ActiveSession {
  id: string;
  mode: SessionMode;
  title: string;
  subjectLabel: string;
  categoryId: string | "all";
  subcategoryId: string | "all";
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, string | string[]>;
  revealedQuestionIds: string[];
  flaggedQuestionIds: string[];
  startedAt: string;
  timeLimitSeconds: number | null;
  remainingSeconds: number | null;
  isSubmitted: boolean;
  completedRecordId?: string;
}

export interface UserSettings {
  userName: string;
  theme: "system" | "light" | "dark";
  explanationLanguage: "both" | "de" | "ar";
  showArabicSubtitles: boolean;
  defaultExamDurationMinutes: number;
  defaultExamQuestionCount: number;
}

export interface TrainerState {
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;

  questionProgress: Record<string, QuestionProgress>;
  bookmarks: string[];
  revisionFlaggedIds: string[];
  examHistory: CompletedExamRecord[];
  recentActivity: StudyActivityItem[];
  activeSession: ActiveSession | null;
  settings: UserSettings;

  // Actions
  toggleBookmark: (questionId: string) => void;
  toggleRevisionFlag: (questionId: string) => void;
  recordSingleQuestionAttempt: (
    questionId: string,
    userAnswer: string | string[]
  ) => boolean;

  startSession: (params: {
    mode: SessionMode;
    title: string;
    subjectLabel: string;
    categoryId?: string | "all";
    subcategoryId?: string | "all";
    questionIds: string[];
    timeLimitSeconds: number | null;
  }) => void;

  setSessionAnswer: (questionId: string, answer: string | string[]) => void;
  revealPracticeAnswer: (questionId: string) => boolean;
  setSessionIndex: (index: number) => void;
  toggleSessionFlag: (questionId: string) => void;
  tickSessionTimer: () => { expired: boolean; completedRecord?: CompletedExamRecord };
  submitActiveSession: () => CompletedExamRecord | null;
  clearActiveSession: () => void;

  updateSettings: (partial: Partial<UserSettings>) => void;

  // Granular Reset Actions
  resetAllProgress: (options?: { keepBookmarks?: boolean }) => void;
  resetCategoryProgress: (categoryId: string) => void;
  resetSubcategoryProgress: (subcategoryId: string) => void;
  resetRevisionCenter: () => void;
  resetExamHistory: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  userName: "Kandidat",
  theme: "light",
  explanationLanguage: "both",
  showArabicSubtitles: false,
  defaultExamDurationMinutes: 45,
  defaultExamQuestionCount: 30,
};

export const useTrainerStore = create<TrainerState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      setHasHydrated: (val) => set({ hasHydrated: val }),

      questionProgress: {},
      bookmarks: [],
      revisionFlaggedIds: [],
      examHistory: [],
      recentActivity: [],
      activeSession: null,
      settings: DEFAULT_SETTINGS,

      toggleBookmark: (questionId) =>
        set((state) => {
          const exists = state.bookmarks.includes(questionId);
          return {
            bookmarks: exists
              ? state.bookmarks.filter((id) => id !== questionId)
              : [questionId, ...state.bookmarks],
          };
        }),

      toggleRevisionFlag: (questionId) =>
        set((state) => {
          const exists = state.revisionFlaggedIds.includes(questionId);
          return {
            revisionFlaggedIds: exists
              ? state.revisionFlaggedIds.filter((id) => id !== questionId)
              : [questionId, ...state.revisionFlaggedIds],
          };
        }),

      recordSingleQuestionAttempt: (questionId, userAnswer) => {
        const q = getQuestionById(questionId);
        if (!q) return false;
        const isCorrect = evaluateAnswer(q, userAnswer);
        const now = new Date().toISOString();

        set((state) => {
          const prev = state.questionProgress[questionId];
          const updated: QuestionProgress = {
            questionId,
            attempts: (prev?.attempts || 0) + 1,
            correctCount: (prev?.correctCount || 0) + (isCorrect ? 1 : 0),
            incorrectCount: (prev?.incorrectCount || 0) + (isCorrect ? 0 : 1),
            lastAnswer: userAnswer,
            lastCorrect: isCorrect,
            lastAttemptedAt: now,
          };

          return {
            questionProgress: {
              ...state.questionProgress,
              [questionId]: updated,
            },
          };
        });

        return isCorrect;
      },

      startSession: ({
        mode,
        title,
        subjectLabel,
        categoryId = "all",
        subcategoryId = "all",
        questionIds,
        timeLimitSeconds,
      }) => {
        const deduplicatedIds = [...new Set(questionIds)];
        const now = new Date().toISOString();
        const session: ActiveSession = {
          id: `session-${Date.now()}`,
          mode,
          title,
          subjectLabel,
          categoryId,
          subcategoryId,
          questionIds: deduplicatedIds,
          currentIndex: 0,
          answers: {},
          revealedQuestionIds: [],
          flaggedQuestionIds: [],
          startedAt: now,
          timeLimitSeconds,
          remainingSeconds: timeLimitSeconds,
          isSubmitted: false,
        };
        set({ activeSession: session });
      },

      setSessionAnswer: (questionId, answer) =>
        set((state) => {
          if (!state.activeSession || state.activeSession.isSubmitted) return state;
          return {
            activeSession: {
              ...state.activeSession,
              answers: {
                ...state.activeSession.answers,
                [questionId]: answer,
              },
            },
          };
        }),

      revealPracticeAnswer: (questionId) => {
        const state = get();
        const session = state.activeSession;
        if (!session || session.mode !== "practice") return false;
        const ans = session.answers[questionId];
        if (!isQuestionAnswered(ans)) return false;

        const isCorrect = state.recordSingleQuestionAttempt(questionId, ans);

        set((s) => {
          if (!s.activeSession) return s;
          const already = s.activeSession.revealedQuestionIds.includes(questionId);
          return {
            activeSession: {
              ...s.activeSession,
              revealedQuestionIds: already
                ? s.activeSession.revealedQuestionIds
                : [...s.activeSession.revealedQuestionIds, questionId],
            },
          };
        });

        return isCorrect;
      },

      setSessionIndex: (index) =>
        set((state) => {
          if (!state.activeSession) return state;
          const clamped = Math.max(
            0,
            Math.min(index, state.activeSession.questionIds.length - 1)
          );
          return {
            activeSession: {
              ...state.activeSession,
              currentIndex: clamped,
            },
          };
        }),

      toggleSessionFlag: (questionId) =>
        set((state) => {
          if (!state.activeSession) return state;
          const flagged = state.activeSession.flaggedQuestionIds.includes(questionId);
          const nextSessionFlags = flagged
            ? state.activeSession.flaggedQuestionIds.filter((id) => id !== questionId)
            : [...state.activeSession.flaggedQuestionIds, questionId];

          const inGlobal = state.revisionFlaggedIds.includes(questionId);
          const nextGlobalFlags = flagged
            ? state.revisionFlaggedIds.filter((id) => id !== questionId)
            : inGlobal
              ? state.revisionFlaggedIds
              : [questionId, ...state.revisionFlaggedIds];

          return {
            revisionFlaggedIds: nextGlobalFlags,
            activeSession: {
              ...state.activeSession,
              flaggedQuestionIds: nextSessionFlags,
            },
          };
        }),

      tickSessionTimer: () => {
        const state = get();
        const session = state.activeSession;
        if (
          !session ||
          session.isSubmitted ||
          session.remainingSeconds === null
        ) {
          return { expired: false };
        }

        if (session.remainingSeconds <= 1) {
          const completed = get().submitActiveSession();
          return { expired: true, completedRecord: completed ?? undefined };
        }

        set({
          activeSession: {
            ...session,
            remainingSeconds: session.remainingSeconds - 1,
          },
        });
        return { expired: false };
      },

      submitActiveSession: () => {
        const state = get();
        const session = state.activeSession;
        if (!session) return null;
        if (session.isSubmitted && session.completedRecordId) {
          return (
            state.examHistory.find((r) => r.id === session.completedRecordId) || null
          );
        }

        const now = new Date().toISOString();
        const startMs = new Date(session.startedAt).getTime();
        const elapsedSeconds =
          session.timeLimitSeconds !== null && session.remainingSeconds !== null
            ? Math.max(1, session.timeLimitSeconds - session.remainingSeconds)
            : Math.max(1, Math.round((Date.now() - startMs) / 1000));

        const updatedProgress = { ...state.questionProgress };
        const results: CompletedExamQuestionResult[] = [];
        let answeredCount = 0;
        let correctCount = 0;

        for (const qId of session.questionIds) {
          const q = getQuestionById(qId);
          if (!q) continue;
          const userAns = session.answers[qId] ?? null;
          const answered = isQuestionAnswered(userAns);
          const correct = answered ? evaluateAnswer(q, userAns) : false;
          const flagged = session.flaggedQuestionIds.includes(qId);

          if (answered) {
            answeredCount++;
            if (correct) correctCount++;

            const alreadyRevealedInPractice =
              session.mode === "practice" &&
              session.revealedQuestionIds.includes(qId);

            if (!alreadyRevealedInPractice) {
              const prev = updatedProgress[qId];
              updatedProgress[qId] = {
                questionId: qId,
                attempts: (prev?.attempts || 0) + 1,
                correctCount: (prev?.correctCount || 0) + (correct ? 1 : 0),
                incorrectCount: (prev?.incorrectCount || 0) + (correct ? 0 : 1),
                lastAnswer: userAns!,
                lastCorrect: correct,
                lastAttemptedAt: now,
              };
            }
          }

          results.push({
            questionId: qId,
            userAnswer: userAns,
            isAnswered: answered,
            isCorrect: correct,
            flaggedForRevision: flagged,
          });
        }

        const totalQuestions = session.questionIds.length;
        const accuracyPercent =
          totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const recordId = `exam-${Date.now()}`;

        const record: CompletedExamRecord = {
          id: recordId,
          title: session.title,
          mode: session.mode,
          categoryId: session.categoryId,
          subcategoryId: session.subcategoryId,
          subjectLabel: session.subjectLabel,
          startedAt: session.startedAt,
          completedAt: now,
          durationSeconds: elapsedSeconds,
          timeLimitSeconds: session.timeLimitSeconds,
          totalQuestions,
          answeredCount,
          correctCount,
          accuracyPercent,
          passed: accuracyPercent >= 60,
          results,
        };

        const activityItem: StudyActivityItem = {
          id: `act-${Date.now()}`,
          type: session.mode === "exam" ? "exam_completed" : "practice_completed",
          title: session.title,
          subtitle: `${session.subjectLabel} • ${correctCount}/${totalQuestions} korrekt (${accuracyPercent}%)`,
          timestamp: now,
          accuracyPercent,
          categoryId: session.categoryId !== "all" ? session.categoryId : undefined,
          sessionId: recordId,
        };

        set((s) => ({
          questionProgress: updatedProgress,
          examHistory: [record, ...s.examHistory].slice(0, 100),
          recentActivity: [activityItem, ...s.recentActivity].slice(0, 40),
          activeSession: s.activeSession
            ? {
                ...s.activeSession,
                isSubmitted: true,
                remainingSeconds: 0,
                completedRecordId: recordId,
              }
            : null,
        }));

        return record;
      },

      clearActiveSession: () => set({ activeSession: null }),

      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      // 1. Full Progress Reset (with option to keep or clear bookmarks)
      resetAllProgress: (options) =>
        set((state) => ({
          questionProgress: {},
          bookmarks: options?.keepBookmarks ? state.bookmarks : [],
          revisionFlaggedIds: [],
          examHistory: [],
          recentActivity: [],
          activeSession: null,
        })),

      // 2. Category-Level Progress Reset
      resetCategoryProgress: (categoryId) =>
        set((state) => {
          const allQuestions = getAllQuestions();
          const targetIds = new Set(
            allQuestions
              .filter(
                (q) => q.categoryId === categoryId || q.categorySlug === categoryId
              )
              .map((q) => q.id)
          );

          const nextProgress = { ...state.questionProgress };
          for (const id of targetIds) {
            delete nextProgress[id];
          }

          return {
            questionProgress: nextProgress,
            revisionFlaggedIds: state.revisionFlaggedIds.filter(
              (id) => !targetIds.has(id)
            ),
          };
        }),

      // 3. Subcategory-Level Progress Reset
      resetSubcategoryProgress: (subcategoryId) =>
        set((state) => {
          const allQuestions = getAllQuestions();
          const targetIds = new Set(
            allQuestions
              .filter(
                (q) =>
                  q.subcategoryId === subcategoryId ||
                  q.subcategorySlug === subcategoryId
              )
              .map((q) => q.id)
          );

          const nextProgress = { ...state.questionProgress };
          for (const id of targetIds) {
            delete nextProgress[id];
          }

          return {
            questionProgress: nextProgress,
            revisionFlaggedIds: state.revisionFlaggedIds.filter(
              (id) => !targetIds.has(id)
            ),
          };
        }),

      // 4. Revision Center Reset (clears flagged items & resets open mistakes)
      resetRevisionCenter: () =>
        set((state) => {
          const nextProgress = { ...state.questionProgress };
          for (const [qId, entry] of Object.entries(nextProgress)) {
            if (!entry.lastCorrect) {
              delete nextProgress[qId];
            }
          }
          return {
            questionProgress: nextProgress,
            revisionFlaggedIds: [],
          };
        }),

      // 5. Exam History Reset
      resetExamHistory: () =>
        set({
          examHistory: [],
          recentActivity: [],
        }),
    }),
    {
      name: "muno-etrainer-storage-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        questionProgress: state.questionProgress,
        bookmarks: state.bookmarks,
        revisionFlaggedIds: state.revisionFlaggedIds,
        examHistory: state.examHistory,
        recentActivity: state.recentActivity,
        activeSession: state.activeSession,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Computes real analytics & recommendations from stored progress without inventing numbers.
 */
export function computeTrainerAnalytics(state: Pick<
  TrainerState,
  "questionProgress" | "examHistory" | "bookmarks" | "revisionFlaggedIds"
>) {
  const bank = getQuestionBank();
  const allQuestions = getAllQuestions();
  const totalQuestions = allQuestions.length;

  const progressEntries = Object.values(state.questionProgress);
  const attemptedQuestionsCount = progressEntries.filter((p) => p.attempts > 0).length;

  let totalAttemptsSum = 0;
  let totalCorrectSum = 0;
  let masteredCount = 0;
  const mistakeIds: string[] = [];

  for (const entry of progressEntries) {
    totalAttemptsSum += entry.attempts;
    totalCorrectSum += entry.correctCount;
    if (entry.lastCorrect) {
      masteredCount++;
    } else if (entry.attempts > 0) {
      mistakeIds.push(entry.questionId);
    }
  }

  const overallAccuracy =
    totalAttemptsSum > 0 ? Math.round((totalCorrectSum / totalAttemptsSum) * 100) : 0;

  const completedExamsCount = state.examHistory.filter((e) => e.mode === "exam").length;
  const completedSessionsCount = state.examHistory.length;

  // Progress by category
  const categoryStats = bank.categories.map((cat) => {
    const catQuestions = allQuestions.filter((q) => q.categoryId === cat.id);
    const catTotal = catQuestions.length;
    let catAttempted = 0;
    let catMastered = 0;
    let catAttemptsSum = 0;
    let catCorrectSum = 0;

    for (const q of catQuestions) {
      const p = state.questionProgress[q.id];
      if (p && p.attempts > 0) {
        catAttempted++;
        catAttemptsSum += p.attempts;
        catCorrectSum += p.correctCount;
        if (p.lastCorrect) catMastered++;
      }
    }

    const completionPercent = catTotal > 0 ? Math.round((catAttempted / catTotal) * 100) : 0;
    const accuracyPercent =
      catAttemptsSum > 0 ? Math.round((catCorrectSum / catAttemptsSum) * 100) : null;

    return {
      category: cat,
      totalQuestions: catTotal,
      attemptedCount: catAttempted,
      masteredCount: catMastered,
      completionPercent,
      accuracyPercent,
    };
  });

  // Subcategory performance & weakest subcategories
  const subcategoryStats = bank.categories.flatMap((cat) =>
    cat.subcategories.map((sub) => {
      const subTotal = sub.questions.length;
      let attempted = 0;
      let attemptsSum = 0;
      let correctSum = 0;
      let mistakes = 0;

      for (const q of sub.questions) {
        const p = state.questionProgress[q.id];
        if (p && p.attempts > 0) {
          attempted++;
          attemptsSum += p.attempts;
          correctSum += p.correctCount;
          if (!p.lastCorrect) mistakes++;
        }
      }

      const accuracyPercent =
        attemptsSum > 0 ? Math.round((correctSum / attemptsSum) * 100) : null;
      const completionPercent = subTotal > 0 ? Math.round((attempted / subTotal) * 100) : 0;

      return {
        categoryId: cat.id,
        categorySlug: cat.slug,
        categoryTitleDe: cat.titleDe,
        subcategoryId: sub.id,
        subcategorySlug: sub.slug,
        subcategoryTitleDe: sub.titleDe,
        subcategoryTitleAr: sub.titleAr,
        recommendedTimeMinutes: sub.recommendedTimeMinutes,
        totalQuestions: subTotal,
        attemptedCount: attempted,
        accuracyPercent,
        completionPercent,
        mistakesCount: mistakes,
      };
    })
  );

  const weakestSubcategories = subcategoryStats
    .filter((s) => s.attemptedCount > 0 && s.accuracyPercent !== null)
    .sort((a, b) => (a.accuracyPercent ?? 100) - (b.accuracyPercent ?? 100))
    .slice(0, 5);

  let recommendedAction: {
    badge: string;
    title: string;
    subtitle: string;
    href: string;
    ctaLabel: string;
  };

  if (mistakeIds.length >= 3) {
    recommendedAction = {
      badge: `${mistakeIds.length} offene Fehler`,
      title: "Fehler gezielt wiederholen",
      subtitle:
        "Schließe deine offenen Wissenslücken im Fehlertraining mit direktem Erklärungs-Feedback.",
      href: "/revision",
      ctaLabel: "Fehlertraining starten",
    };
  } else if (weakestSubcategories.length > 0 && (weakestSubcategories[0].accuracyPercent ?? 100) < 75) {
    const w = weakestSubcategories[0];
    recommendedAction = {
      badge: `Schwächster Bereich • ${w.accuracyPercent}% Genauigkeit`,
      title: `${w.subcategoryId} ${w.subcategoryTitleDe}`,
      subtitle: `${w.categoryTitleDe} (${w.attemptedCount}/${w.totalQuestions} bearbeitet)`,
      href: `/practice?category=${w.categoryId}&subcategory=${w.subcategoryId}`,
      ctaLabel: "Gezielt üben",
    };
  } else if (attemptedQuestionsCount > 0) {
    const nextCat =
      [...categoryStats].sort((a, b) => a.completionPercent - b.completionPercent)[0] ||
      categoryStats[0];
    recommendedAction = {
      badge: `Nächster Schwerpunkt • ${nextCat.completionPercent}% abgeschlossen`,
      title: nextCat.category.titleDe,
      subtitle: `${nextCat.attemptedCount} von ${nextCat.totalQuestions} Fragen bearbeitet`,
      href: `/practice?category=${nextCat.category.id}`,
      ctaLabel: "Weiterlernen",
    };
  } else {
    recommendedAction = {
      badge: `Empfohlener Einstieg • 20 Min.`,
      title: "1.1 Grundrechenaufgaben oder Kurz-Simulation",
      subtitle: "Starte deine erste Übungseinheit oder absolviere einen realistischen Modelltest.",
      href: "/practice?category=cat-1&subcategory=1.1",
      ctaLabel: "Erste Sitzung starten",
    };
  }

  return {
    totalQuestions,
    attemptedQuestionsCount,
    masteredCount,
    overallAccuracy,
    completedExamsCount,
    completedSessionsCount,
    mistakeIds,
    categoryStats,
    subcategoryStats,
    weakestSubcategories,
    recommendedAction,
  };
}
