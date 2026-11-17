import { describe, expect, it } from "vitest";
import {
  buildSessionQuestions,
  evaluateAnswer,
  getAllQuestions,
  getGeometryBlankLabels,
  getQuestionBank,
  getQuestionById,
  isOperatorBlankQuestion,
  isQuestionAnswered,
} from "../questions";
import {
  getAllGuides,
  getGuideBySubcategoryId,
  getGuidesBank,
  getGuidesByCategoryId,
} from "../guides";

describe("Question Bank Integrity, Study Guides & Evaluation", () => {
  it("validates the entire questions.json against Zod schema with exact counts", () => {
    const bank = getQuestionBank();
    expect(bank.meta.totalCategories).toBe(6);
    expect(bank.meta.totalSubcategories).toBe(32);
    expect(bank.meta.totalQuestions).toBe(683);

    const all = getAllQuestions();
    expect(all.length).toBe(683);

    const uniqueIds = new Set(all.map((q) => q.id));
    expect(uniqueIds.size).toBe(683);
  });

  it("validates guides.json against Zod schema and verifies 1-to-1 mapping with all 32 subcategories", () => {
    const guidesBank = getGuidesBank();
    expect(guidesBank.meta.totalGuides).toBe(32);
    expect(guidesBank.meta.totalWorkedExamples).toBe(64);

    const guides = getAllGuides();
    expect(guides.length).toBe(32);

    const questionBank = getQuestionBank();
    const allSubcategories = questionBank.categories.flatMap(
      (c) => c.subcategories
    );
    expect(allSubcategories.length).toBe(32);

    for (const sub of allSubcategories) {
      const guide = getGuideBySubcategoryId(sub.id);
      expect(guide, `Missing guide for subcategory ${sub.id}`).toBeDefined();
      expect(guide!.subcategoryId).toBe(sub.id);
      expect(guide!.questionCount).toBe(sub.questions.length);
      expect(guide!.examples.length).toBe(2);
      expect(guide!.steps.length).toBeGreaterThan(0);
      expect(guide!.examTraps.length).toBeGreaterThan(0);
    }

    expect(getGuidesByCategoryId("cat-1").length).toBe(14);
    expect(getGuidesByCategoryId("all").length).toBe(32);
  });

  it("evaluates every single question's own canonical correctAnswers as true", () => {
    const all = getAllQuestions();
    for (const q of all) {
      const canonicalInput =
        q.type === "multi-select" ? q.correctAnswers : q.correctAnswers[0];
      expect(
        evaluateAnswer(q, canonicalInput),
        `Failed canonical evaluation for question ${q.id} (${q.type}): ${JSON.stringify(q.correctAnswers)}`
      ).toBe(true);
    }
  });

  it("evaluates audited target questions (1.1-09, 1.1-11, 1.4-01, 1.4-08, 1.4-26, 1.11-08, 1.9-01) and thousands separators", () => {
    // 1.1-09: "9.489 x 8.112" -> ["76974768"]
    const q1109 = getQuestionById("1.1-09")!;
    expect(q1109.correctAnswers).toEqual(["76974768"]);
    expect(evaluateAnswer(q1109, "76974768")).toBe(true);
    expect(evaluateAnswer(q1109, "76.974.768")).toBe(true);
    expect(evaluateAnswer(q1109, "76974760")).toBe(false);

    // 1.1-11: "580,79 x 725,40" -> ["421305,066"]
    const q1111 = getQuestionById("1.1-11")!;
    expect(q1111.correctAnswers).toEqual(["421305,066"]);
    expect(evaluateAnswer(q1111, "421305,066")).toBe(true);
    expect(evaluateAnswer(q1111, "421.305,066")).toBe(true);
    expect(evaluateAnswer(q1111, "421305.066")).toBe(true);

    // 1.4-01: "50 + (47 - 16) + 89 - (59 - 9) =" -> ["120"]
    const q1401 = getQuestionById("1.4-01")!;
    expect(q1401.correctAnswers).toEqual(["120"]);
    expect(evaluateAnswer(q1401, "120")).toBe(true);
    expect(evaluateAnswer(q1401, " 120 ")).toBe(true);

    // 1.4-08: "64 + 26 - (37 - [20 + 18]) - 16 =" -> ["75"]
    const q1408 = getQuestionById("1.4-08")!;
    expect(q1408.correctAnswers).toEqual(["75"]);
    expect(evaluateAnswer(q1408, "75")).toBe(true);
    expect(evaluateAnswer(q1408, "73")).toBe(false);

    // 1.4-26: "2.750 - (5 × 325) - (69 ÷ 3) =" -> ["1102"]
    const q1426 = getQuestionById("1.4-26")!;
    expect(q1426.correctAnswers).toEqual(["1102"]);
    expect(evaluateAnswer(q1426, "1102")).toBe(true);
    expect(evaluateAnswer(q1426, "1.102")).toBe(true);
    expect(evaluateAnswer(q1426, "1100")).toBe(false);

    // 1.11-08: multi-part pipe answer "1500 | 1,25"
    const q11108 = getQuestionById("1.11-08")!;
    expect(q11108.correctAnswers).toEqual(["1500 | 1,25"]);
    expect(evaluateAnswer(q11108, "1500 | 1,25")).toBe(true);
    expect(evaluateAnswer(q11108, "1.500 | 1,25")).toBe(true);
    expect(evaluateAnswer(q11108, "1500 € | 1,25 %")).toBe(true);
    expect(evaluateAnswer(q11108, "A: 1500 | B: 1,25")).toBe(true);
    expect(evaluateAnswer(q11108, "1500, 1,25")).toBe(true);
    expect(evaluateAnswer(q11108, "1500 | 1,5")).toBe(false);

    // 1.9-01: geometry multi-field
    const q1901 = getQuestionById("1.9-01")!;
    expect(q1901.correctAnswers).toEqual(["Seite b: 10 | Flächeninhalt: 60"]);
    expect(evaluateAnswer(q1901, "Seite b: 10 | Flächeninhalt: 60")).toBe(true);
    expect(evaluateAnswer(q1901, "10 | 60")).toBe(true);
    expect(evaluateAnswer(q1901, "10, 60")).toBe(true);
    expect(evaluateAnswer(q1901, "Seite b: 10 | Flächeninhalt: 50")).toBe(false);
  });

  it("handles multiple-choice and boolean-choice accurately", () => {
    const mc = getQuestionById("1.6-01")!;
    expect(mc.type).toBe("multiple-choice");
    expect(evaluateAnswer(mc, "D")).toBe(true);
    expect(evaluateAnswer(mc, "d")).toBe(true);
    expect(evaluateAnswer(mc, "A")).toBe(false);
    expect(evaluateAnswer(mc, "")).toBe(false);

    const bc = getQuestionById("3.4-01")!;
    expect(bc.type).toBe("boolean-choice");
    expect(evaluateAnswer(bc, "B")).toBe(true);
    expect(evaluateAnswer(bc, "A")).toBe(false);
  });

  it("handles multi-select set equality strictly", () => {
    const ms = getQuestionById("2.2-14")!;
    expect(ms.type).toBe("multi-select");
    expect(evaluateAnswer(ms, ["C", "D"])).toBe(true);
    expect(evaluateAnswer(ms, ["D", "C"])).toBe(true);
    expect(evaluateAnswer(ms, ["C"])).toBe(false);
    expect(evaluateAnswer(ms, ["A", "C", "D"])).toBe(false);
  });

  it("normalizes German decimals, thousands, units, and fractions in text-input", () => {
    const qDec = getQuestionById("1.1-02")!; // ["30397,19"]
    expect(evaluateAnswer(qDec, "30397,19")).toBe(true);
    expect(evaluateAnswer(qDec, "30397.19")).toBe(true);
    expect(evaluateAnswer(qDec, "30.397,19")).toBe(true);
    expect(evaluateAnswer(qDec, "30397")).toBe(false);

    const qInterest = getQuestionById("1.11-01")!; // ["1312,50"]
    expect(evaluateAnswer(qInterest, "1312,50")).toBe(true);
    expect(evaluateAnswer(qInterest, "1312,5")).toBe(true);
    expect(evaluateAnswer(qInterest, "1312.50 €")).toBe(true);

    const qFrac = getQuestionById("1.5-02")!; // ["17/10"]
    expect(evaluateAnswer(qFrac, "17/10")).toBe(true);
    expect(evaluateAnswer(qFrac, " 17 / 10 ")).toBe(true);
    expect(evaluateAnswer(qFrac, "17/11")).toBe(false);
  });

  it("detects and evaluates Subcategory 1.3 operator blanks", () => {
    const qOp = getQuestionById("1.3-05")!; // "4 ___ 8 ___ 19 = 51" => ["×, +"]
    expect(isOperatorBlankQuestion(qOp)).toBe(true);
    expect(evaluateAnswer(qOp, "×, +")).toBe(true);
    expect(evaluateAnswer(qOp, "*, +")).toBe(true);
    expect(evaluateAnswer(qOp, "x, +")).toBe(true);
    expect(evaluateAnswer(qOp, "+, ×")).toBe(false);
  });

  it("detects and evaluates Subcategory 1.9 geometry multi-field blanks", () => {
    const qGeo = getQuestionById("1.9-01")!; // ["Seite b: 10 | Flächeninhalt: 60"]
    expect(getGeometryBlankLabels(qGeo)).toEqual(["Seite b", "Flächeninhalt"]);
    expect(isQuestionAnswered("Seite b: 10 | Flächeninhalt: ")).toBe(false);
    expect(isQuestionAnswered("Seite b: 10 | Flächeninhalt: 60")).toBe(true);
  });

  it("prevents duplicate questions in generated exam sessions", () => {
    const session = buildSessionQuestions({ count: 60, shuffle: true, seed: 42 });
    expect(session.length).toBe(60);
    const ids = new Set(session.map((q) => q.id));
    expect(ids.size).toBe(60);
  });
});
