import rawData from "../../data/questions.json";
import {
  QuestionBankSchema,
  type Category,
  type Difficulty,
  type EnrichedQuestion,
  type QuestionBank,
  type RawQuestion,
  type Subcategory,
} from "./schema";

let validatedBank: QuestionBank | null = null;
let allQuestionsCache: EnrichedQuestion[] | null = null;
let questionByIdMap: Map<string, EnrichedQuestion> | null = null;

export function getQuestionBank(): QuestionBank {
  if (validatedBank) return validatedBank;

  const parsed = QuestionBankSchema.parse(rawData);

  // Verify meta counts and unique IDs
  const seenIds = new Set<string>();
  let subCount = 0;
  let qCount = 0;

  for (const category of parsed.categories) {
    subCount += category.subcategories.length;
    for (const sub of category.subcategories) {
      qCount += sub.questions.length;
      for (const q of sub.questions) {
        if (seenIds.has(q.id)) {
          throw new Error(`Duplicate question ID detected in question bank: ${q.id}`);
        }
        seenIds.add(q.id);
      }
    }
  }

  if (parsed.meta.totalCategories !== parsed.categories.length) {
    throw new Error(
      `Category count mismatch: meta=${parsed.meta.totalCategories}, actual=${parsed.categories.length}`
    );
  }
  if (parsed.meta.totalSubcategories !== subCount) {
    throw new Error(
      `Subcategory count mismatch: meta=${parsed.meta.totalSubcategories}, actual=${subCount}`
    );
  }
  if (parsed.meta.totalQuestions !== qCount) {
    throw new Error(
      `Question count mismatch: meta=${parsed.meta.totalQuestions}, actual=${qCount}`
    );
  }

  validatedBank = parsed;
  return validatedBank;
}

export function getAllQuestions(): EnrichedQuestion[] {
  if (allQuestionsCache) return allQuestionsCache;

  const bank = getQuestionBank();
  const list: EnrichedQuestion[] = [];
  const map = new Map<string, EnrichedQuestion>();

  for (const cat of bank.categories) {
    for (const sub of cat.subcategories) {
      for (const q of sub.questions) {
        const enriched: EnrichedQuestion = {
          ...q,
          categoryId: cat.id,
          categoryCode: cat.code,
          categorySlug: cat.slug,
          categoryTitleDe: cat.titleDe,
          categoryTitleAr: cat.titleAr,
          subcategoryId: sub.id,
          subcategorySlug: sub.slug,
          subcategoryTitleDe: sub.titleDe,
          subcategoryTitleAr: sub.titleAr,
          instructionsDe: sub.instructionsDe,
          recommendedSubcategoryTimeMinutes: sub.recommendedTimeMinutes,
        };
        list.push(enriched);
        map.set(q.id, enriched);
      }
    }
  }

  allQuestionsCache = list;
  questionByIdMap = map;
  return list;
}

export function getQuestionById(id: string): EnrichedQuestion | undefined {
  if (!questionByIdMap) {
    getAllQuestions();
  }
  return questionByIdMap?.get(id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getQuestionBank().categories.find((c) => c.slug === slug || c.id === slug);
}

export function getCategoryById(id: string): Category | undefined {
  return getQuestionBank().categories.find((c) => c.id === id);
}

export function getSubcategoryById(subId: string): {
  category: Category;
  subcategory: Subcategory;
} | undefined {
  for (const category of getQuestionBank().categories) {
    const subcategory = category.subcategories.find(
      (s) => s.id === subId || s.slug === subId
    );
    if (subcategory) return { category, subcategory };
  }
  return undefined;
}

/**
 * Detects whether a text-input question asks for two arithmetic operators (Subcategory 1.3: e.g. "16 ___ 13 ___ 3 = 6").
 * Relies solely on the question prompt text, never inspecting correctAnswers.
 */
export function isOperatorBlankQuestion(question: Pick<RawQuestion, "type" | "question">): boolean {
  if (question.type !== "text-input") return false;
  const matches = question.question.match(/_{2,}/g);
  return Boolean(matches && matches.length === 2 && !question.question.includes(": _____"));
}

/**
 * Extracts labeled geometry blanks (Subcategory 1.9: e.g. "Seite b: _____\nFlächeninhalt: _____")
 * from the question prompt text without inspecting correctAnswers.
 */
export function getGeometryBlankLabels(question: Pick<RawQuestion, "type" | "question">): string[] {
  if (question.type !== "text-input") return [];
  const matches = [...question.question.matchAll(/^([^:\n]+):\s*_{3,}\s*$/gm)];
  return matches.map((m) => m[1].trim());
}

function normalizeOperatorToken(token: string): string {
  const t = token.trim();
  if (t === "*" || t.toLowerCase() === "x" || t === "·" || t === "×") return "×";
  if (t === "/" || t === ":" || t === "÷") return "÷";
  if (t === "-" || t === "–" || t === "—") return "-";
  if (t === "+") return "+";
  return t;
}

/**
 * Normalizes a numeric or text token according to German math conventions:
 * 1. Strips trailing units (€, %, Tage, Monate, etc.) and leading variable prefixes (x =, A), B), etc.)
 * 2. Strips German thousands separators (`.` when followed by 3 digits) BEFORE converting `,` to `.`
 *    so that integers like `1102` and `1.102` or `76974768` and `76.974.768` evaluate identically.
 * 3. Canonicalizes trailing decimal zeros (e.g. `1312,50` -> `1312.5`).
 */
export function normalizeNumericOrTextToken(
  raw: string,
  options?: { treatSingleDotAsDecimal?: boolean }
): string {
  let s = raw
    .trim()
    .replace(/^(?:[xX]\s*=|[a-zA-Z]\)\s*|[a-zA-Z]:\s*)/, "")
    .replace(/\s*(€|%|Tage|Tag|Monate|Monat|Liter|km|Km|m²|m³|cm)\s*$/i, "")
    .replace(/[–—]/g, "-")
    .trim();

  // Fraction normalization e.g. " 17 / 10 " -> "17/10"
  if (/^-?\d+\s*\/\s*\d+$/.test(s)) {
    return s.replace(/\s+/g, "");
  }

  s = s.replace(/\s+/g, "");

  if (options?.treatSingleDotAsDecimal && !s.includes(",") && /^-?\d+\.\d+$/.test(s)) {
    // International dot-decimal fallback when the expected answer is known to be a decimal
  } else {
    // Strip German thousands separators: "." preceded by a digit and followed by exactly 3 digits
    // (before another ".", ",", or end of string), e.g. "1.102" -> "1102", "76.974.768" -> "76974768", "30.397,19" -> "30397,19"
    if (/^-?[1-9]\d{0,2}(?:\.\d{3})+(?:,\d+)?$/.test(s)) {
      s = s.replace(/\./g, "");
    }
    // Convert German decimal comma to dot
    if (s.includes(",")) {
      s = s.replace(",", ".");
    }
  }

  // If it's a valid decimal number, canonicalize trailing zeros (e.g., "1312.50" -> "1312.5")
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const num = Number(s);
    if (!Number.isNaN(num)) {
      return String(num);
    }
  }

  return s.toLowerCase();
}

function tokensMatch(expectedRaw: string, userRaw: string): boolean {
  const expectedCanonical = normalizeNumericOrTextToken(expectedRaw);
  const userGerman = normalizeNumericOrTextToken(userRaw);
  if (userGerman === expectedCanonical) return true;

  // If the expected answer itself has decimal places (contains `,` in German canonical data),
  // also accept international dot-decimal notation (e.g. "30397.19" or "25.133" or "421305.066")
  if (expectedRaw.includes(",")) {
    const userDotDecimal = normalizeNumericOrTextToken(userRaw, {
      treatSingleDotAsDecimal: true,
    });
    if (userDotDecimal === expectedCanonical) return true;
  }

  return false;
}

/**
 * Evaluates a user's answer against a question's correctAnswers across all 4 supported question types.
 */
export function evaluateAnswer(
  question: Pick<RawQuestion, "type" | "correctAnswers" | "question">,
  userAnswer: string | string[] | null | undefined
): boolean {
  if (userAnswer === null || userAnswer === undefined) return false;

  const { type, correctAnswers } = question;

  if (type === "multiple-choice" || type === "boolean-choice") {
    const value = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
    if (!value || !value.trim()) return false;
    const normalizedUser = value.trim().toUpperCase();
    return correctAnswers.some((ans) => ans.trim().toUpperCase() === normalizedUser);
  }

  if (type === "multi-select") {
    const userArr = (
      Array.isArray(userAnswer)
        ? userAnswer
        : userAnswer
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
    ).map((x) => x.trim().toUpperCase());

    const uniqueUser = [...new Set(userArr)].sort();
    const uniqueCorrect = [...new Set(correctAnswers.map((x) => x.trim().toUpperCase()))].sort();

    if (uniqueUser.length === 0 || uniqueUser.length !== uniqueCorrect.length) {
      return false;
    }
    return uniqueUser.every((val, idx) => val === uniqueCorrect[idx]);
  }

  if (type === "text-input") {
    const rawUser = Array.isArray(userAnswer) ? userAnswer.join(" | ") : userAnswer;
    if (!rawUser || !rawUser.trim()) return false;

    const canonicalCorrect = correctAnswers[0].trim();

    // Case 1: Multi-field pipe-separated answer (e.g. Subcategory 1.9 Geometry "Seite b: 10 | Flächeninhalt: 60"
    // or 1.11-08 "1500 | 1,25")
    if (canonicalCorrect.includes("|")) {
      const expectedParts = canonicalCorrect.split("|").map((part) => {
        const trimmed = part.trim();
        if (trimmed.includes(":")) {
          const idx = trimmed.indexOf(":");
          return {
            label: trimmed.slice(0, idx).trim().toLowerCase(),
            rawValue: trimmed.slice(idx + 1).trim(),
          };
        }
        return {
          label: "",
          rawValue: trimmed,
        };
      });

      // Split user input by "|" or ";" or newline
      let userSegments = rawUser
        .split(/[|;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      // If user separated multiple values by comma + space (e.g. "10, 60" or "1500, 1,25")
      if (userSegments.length !== expectedParts.length) {
        const commaSpaceSegments = rawUser
          .split(/,\s+/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (commaSpaceSegments.length === expectedParts.length) {
          userSegments = commaSpaceSegments;
        } else if (expectedParts.every((p) => !p.rawValue.includes(","))) {
          userSegments = rawUser
            .split(/\s*,\s*/)
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }

      if (userSegments.length !== expectedParts.length) {
        return false;
      }

      return expectedParts.every((exp, idx) => {
        const seg = userSegments[idx];
        const segVal = seg.includes(":")
          ? seg.slice(seg.indexOf(":") + 1).trim()
          : seg;
        return tokensMatch(exp.rawValue, segVal);
      });
    }

    // Case 2: Operator pair answers (Subcategory 1.3, e.g. "-, +" or "×, +")
    if (isOperatorBlankQuestion(question)) {
      const expectedOps = canonicalCorrect
        .split(",")
        .map((op) => normalizeOperatorToken(op))
        .filter(Boolean);

      const userOps = rawUser.includes(",")
        ? rawUser.split(",").map((op) => normalizeOperatorToken(op)).filter(Boolean)
        : (rawUser.match(/[+\-–—*xX·×/:÷]/g) || []).map((op) => normalizeOperatorToken(op));

      if (userOps.length !== expectedOps.length) return false;
      return expectedOps.every((op, i) => userOps[i] === op);
    }

    // Case 3: Standard single numeric, fraction, or text answer
    return correctAnswers.some((correct) => tokensMatch(correct, rawUser));
  }

  return false;
}

/**
 * Checks whether a user has provided a non-empty answer for a question.
 */
export function isQuestionAnswered(
  userAnswer: string | string[] | null | undefined
): boolean {
  if (userAnswer === null || userAnswer === undefined) return false;
  if (Array.isArray(userAnswer)) {
    return userAnswer.some((item) => item.trim().length > 0);
  }
  if (userAnswer.includes("|")) {
    const parts = userAnswer.split("|").map((p) => {
      const val = p.includes(":") ? p.split(":").slice(1).join(":").trim() : p.trim();
      return val;
    });
    return parts.every((val) => val.length > 0);
  }
  return userAnswer.trim().length > 0;
}

export interface SessionBuildOptions {
  categoryId?: string | "all";
  subcategoryId?: string | "all";
  difficulty?: Difficulty | "all";
  onlyQuestionIds?: string[];
  count?: number;
  shuffle?: boolean;
  seed?: number;
}

function createRng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a deduplicated list of questions for an Exam or Practice session.
 */
export function buildSessionQuestions(options: SessionBuildOptions = {}): EnrichedQuestion[] {
  const {
    categoryId = "all",
    subcategoryId = "all",
    difficulty = "all",
    onlyQuestionIds,
    count,
    shuffle = true,
    seed,
  } = options;

  const all = getAllQuestions();
  const allowedIdSet = onlyQuestionIds ? new Set(onlyQuestionIds) : null;

  const seen = new Set<string>();
  const filtered: EnrichedQuestion[] = [];

  for (const q of all) {
    if (seen.has(q.id)) continue;
    if (allowedIdSet && !allowedIdSet.has(q.id)) continue;
    if (categoryId !== "all" && q.categoryId !== categoryId && q.categorySlug !== categoryId) {
      continue;
    }
    if (
      subcategoryId !== "all" &&
      q.subcategoryId !== subcategoryId &&
      q.subcategorySlug !== subcategoryId
    ) {
      continue;
    }
    if (difficulty !== "all" && q.difficulty !== difficulty) {
      continue;
    }
    seen.add(q.id);
    filtered.push(q);
  }

  if (shuffle) {
    const rng = createRng(seed);
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
  }

  if (count && count > 0 && count < filtered.length) {
    return filtered.slice(0, count);
  }

  return filtered;
}
