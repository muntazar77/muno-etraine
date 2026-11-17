import rawGuidesData from "../../data/guides.json";
import { GuidesBankSchema, type GuidesBank, type StudyGuide } from "./schema";
import { getQuestionBank } from "./questions";

let validatedGuidesBank: GuidesBank | null = null;
let guideBySubcategoryIdMap: Map<string, StudyGuide> | null = null;

export function getGuidesBank(): GuidesBank {
  if (validatedGuidesBank) return validatedGuidesBank;

  const parsed = GuidesBankSchema.parse(rawGuidesData);

  if (parsed.meta.totalGuides !== parsed.guides.length) {
    throw new Error(
      `Guide count mismatch: meta=${parsed.meta.totalGuides}, actual=${parsed.guides.length}`
    );
  }

  const totalExamples = parsed.guides.reduce(
    (sum, g) => sum + g.examples.length,
    0
  );
  if (parsed.meta.totalWorkedExamples !== totalExamples) {
    throw new Error(
      `Worked examples count mismatch: meta=${parsed.meta.totalWorkedExamples}, actual=${totalExamples}`
    );
  }

  // Verify 1-to-1 mapping with all 32 subcategories in questions.json
  const qBank = getQuestionBank();
  const questionSubIds = new Set(
    qBank.categories.flatMap((c) => c.subcategories.map((s) => s.id))
  );
  const map = new Map<string, StudyGuide>();

  for (const guide of parsed.guides) {
    if (!questionSubIds.has(guide.subcategoryId)) {
      throw new Error(
        `Study guide ${guide.id} references unknown subcategoryId: ${guide.subcategoryId}`
      );
    }
    if (map.has(guide.subcategoryId)) {
      throw new Error(
        `Duplicate study guide for subcategoryId: ${guide.subcategoryId}`
      );
    }
    map.set(guide.subcategoryId, guide);
  }

  if (map.size !== questionSubIds.size) {
    throw new Error(
      `1-to-1 mapping mismatch between guides (${map.size}) and question subcategories (${questionSubIds.size})`
    );
  }

  validatedGuidesBank = parsed;
  guideBySubcategoryIdMap = map;
  return validatedGuidesBank;
}

export function getAllGuides(): StudyGuide[] {
  return getGuidesBank().guides;
}

export function getGuideBySubcategoryId(
  subcategoryId: string
): StudyGuide | undefined {
  if (!guideBySubcategoryIdMap) {
    getGuidesBank();
  }
  return guideBySubcategoryIdMap?.get(subcategoryId);
}

export function getGuidesByCategoryId(categoryId: string): StudyGuide[] {
  const all = getAllGuides();
  if (categoryId === "all") return all;
  return all.filter((g) => g.categoryId === categoryId);
}
