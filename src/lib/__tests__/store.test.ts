import { beforeEach, describe, expect, it } from "vitest";
import { useTrainerStore, computeTrainerAnalytics } from "@/store/useTrainerStore";
import { getQuestionById } from "@/lib/questions";

// Provide a simple in-memory localStorage mock for Node test environment
const memoryStorage: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (key: string) => memoryStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    memoryStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete memoryStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(memoryStorage)) delete memoryStorage[k];
  },
  key: (i: number) => Object.keys(memoryStorage)[i] ?? null,
  get length() {
    return Object.keys(memoryStorage).length;
  },
};

describe("Trainer Store & Exam Engine Flows", () => {
  beforeEach(() => {
    useTrainerStore.getState().resetAllProgress();
  });

  it("starts an exam session, deduplicates question IDs, and preserves answers across navigation", () => {
    const store = useTrainerStore.getState();
    store.startSession({
      mode: "exam",
      title: "Modellprüfung",
      subjectLabel: "Mathematik",
      categoryId: "cat-1",
      questionIds: ["1.6-01", "1.1-01", "1.6-01", "3.4-01"],
      timeLimitSeconds: 600,
    });

    const s1 = useTrainerStore.getState().activeSession!;
    expect(s1.questionIds).toEqual(["1.6-01", "1.1-01", "3.4-01"]);
    expect(s1.currentIndex).toBe(0);

    // Answer Q1 ("1.6-01" -> "D")
    store.setSessionAnswer("1.6-01", "D");
    // Navigate Next -> Last -> First
    store.setSessionIndex(1);
    expect(useTrainerStore.getState().activeSession!.currentIndex).toBe(1);
    store.setSessionAnswer("1.1-01", "99999"); // Intentionally wrong
    store.setSessionIndex(2);
    store.setSessionIndex(0);

    const s2 = useTrainerStore.getState().activeSession!;
    expect(s2.answers["1.6-01"]).toBe("D");
    expect(s2.answers["1.1-01"]).toBe("99999");
  });

  it("auto-submits safely when countdown timer expires and computes real analytics", () => {
    const store = useTrainerStore.getState();
    const q1 = getQuestionById("1.6-01")!;
    const q2 = getQuestionById("1.1-01")!;

    store.startSession({
      mode: "exam",
      title: "Kurztest",
      subjectLabel: "Mathematik",
      categoryId: "cat-1",
      questionIds: [q1.id, q2.id],
      timeLimitSeconds: 2,
    });

    store.setSessionAnswer(q1.id, q1.correctAnswers[0]);
    // Leave q2 unanswered

    const tick1 = store.tickSessionTimer();
    expect(tick1.expired).toBe(false);
    expect(useTrainerStore.getState().activeSession?.remainingSeconds).toBe(1);

    const tick2 = store.tickSessionTimer();
    expect(tick2.expired).toBe(true);
    expect(tick2.completedRecord).toBeDefined();
    expect(tick2.completedRecord?.correctCount).toBe(1);
    expect(tick2.completedRecord?.answeredCount).toBe(1);
    expect(tick2.completedRecord?.totalQuestions).toBe(2);
    expect(tick2.completedRecord?.accuracyPercent).toBe(50);

    const afterState = useTrainerStore.getState();
    expect(afterState.activeSession?.isSubmitted).toBe(true);
    expect(afterState.examHistory.length).toBe(1);

    const analytics = computeTrainerAnalytics(afterState);
    expect(analytics.attemptedQuestionsCount).toBe(1);
    expect(analytics.overallAccuracy).toBe(100); // 1 attempted, 1 correct
    expect(analytics.completedExamsCount).toBe(1);
  });

  it("manages bookmarks, revision flags, and mistakes queue accurately", () => {
    const store = useTrainerStore.getState();
    store.toggleBookmark("1.6-01");
    expect(useTrainerStore.getState().bookmarks).toContain("1.6-01");

    store.recordSingleQuestionAttempt("1.6-01", "A"); // Wrong answer (correct is D)
    const analytics1 = computeTrainerAnalytics(useTrainerStore.getState());
    expect(analytics1.mistakeIds).toContain("1.6-01");

    // Retry and answer correctly
    store.recordSingleQuestionAttempt("1.6-01", "D");
    const analytics2 = computeTrainerAnalytics(useTrainerStore.getState());
    expect(analytics2.mistakeIds).not.toContain("1.6-01");
    expect(analytics2.masteredCount).toBe(1);
  });

  it("supports granular resets: resetSubcategoryProgress, resetCategoryProgress, resetRevisionCenter, resetExamHistory, and resetAllProgress(keepBookmarks)", () => {
    const store = useTrainerStore.getState();

    // Record attempts in Subcategory 1.4 ("1.4-01"), Subcategory 1.6 ("1.6-01"), and Category 2 ("2.1-01")
    store.recordSingleQuestionAttempt("1.4-01", "120"); // Correct in 1.4
    store.recordSingleQuestionAttempt("1.6-01", "A"); // Wrong in 1.6
    store.recordSingleQuestionAttempt("2.1-01", "wrong"); // Wrong in 2.1
    store.toggleRevisionFlag("1.4-01");
    store.toggleRevisionFlag("2.1-01");
    store.toggleBookmark("2.1-01");

    expect(Object.keys(useTrainerStore.getState().questionProgress)).toEqual([
      "1.4-01",
      "1.6-01",
      "2.1-01",
    ]);

    // 1. Reset only subcategory 1.4 -> 1.6 and 2.1 must remain intact
    store.resetSubcategoryProgress("1.4");
    expect(useTrainerStore.getState().questionProgress["1.4-01"]).toBeUndefined();
    expect(useTrainerStore.getState().questionProgress["1.6-01"]).toBeDefined();
    expect(useTrainerStore.getState().questionProgress["2.1-01"]).toBeDefined();
    expect(useTrainerStore.getState().revisionFlaggedIds).not.toContain("1.4-01");
    expect(useTrainerStore.getState().revisionFlaggedIds).toContain("2.1-01");

    // 2. Reset Category 1 ("cat-1") -> 1.6 is cleared, 2.1 remains intact
    store.resetCategoryProgress("cat-1");
    expect(useTrainerStore.getState().questionProgress["1.6-01"]).toBeUndefined();
    expect(useTrainerStore.getState().questionProgress["2.1-01"]).toBeDefined();

    // 3. Reset Revision Center -> clears mistake state and revisionFlaggedIds while keeping attempts
    store.resetRevisionCenter();
    expect(useTrainerStore.getState().revisionFlaggedIds).toEqual([]);
    const analyticsAfterRevReset = computeTrainerAnalytics(
      useTrainerStore.getState()
    );
    expect(analyticsAfterRevReset.mistakeIds).toEqual([]);

    // 4. Reset All Progress with keepBookmarks: true -> preserves bookmarks
    store.resetAllProgress({ keepBookmarks: true });
    expect(useTrainerStore.getState().questionProgress).toEqual({});
    expect(useTrainerStore.getState().bookmarks).toEqual(["2.1-01"]);

    // 5. Reset All Progress with keepBookmarks: false -> clears bookmarks too
    store.resetAllProgress({ keepBookmarks: false });
    expect(useTrainerStore.getState().bookmarks).toEqual([]);
  });
});
