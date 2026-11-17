import { z } from "zod";

export const QuestionTypeSchema = z.enum([
  "multiple-choice",
  "multi-select",
  "text-input",
  "boolean-choice",
]);

export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const DifficultySchema = z.enum(["leicht", "mittel", "schwer"]);

export type Difficulty = z.infer<typeof DifficultySchema>;

export const QuestionOptionSchema = z.object({
  key: z.string().min(1),
  text: z.string(),
});

export type QuestionOption = z.infer<typeof QuestionOptionSchema>;

export const QuestionSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  type: QuestionTypeSchema,
  difficulty: DifficultySchema,
  timeLimitSeconds: z.number().int().positive(),
  question: z.string().min(1),
  media: z.unknown().nullable(),
  options: z.array(QuestionOptionSchema),
  correctAnswers: z.array(z.string()).min(1),
  explanationDe: z.string(),
  explanationAr: z.string(),
});

export type RawQuestion = z.infer<typeof QuestionSchema>;

export const SubcategorySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  titleDe: z.string().min(1),
  titleAr: z.string().min(1),
  recommendedTimeMinutes: z.number().positive(),
  instructionsDe: z.string(),
  questions: z.array(QuestionSchema).min(1),
});

export type Subcategory = z.infer<typeof SubcategorySchema>;

export const CategorySchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  slug: z.string().min(1),
  titleDe: z.string().min(1),
  titleAr: z.string().min(1),
  subcategories: z.array(SubcategorySchema).min(1),
});

export type Category = z.infer<typeof CategorySchema>;

export const QuestionBankMetaSchema = z.object({
  title: z.string().min(1),
  version: z.string().min(1),
  language: z.string().min(1),
  explanationLanguage: z.string().min(1),
  totalCategories: z.number().int().positive(),
  totalSubcategories: z.number().int().positive(),
  totalQuestions: z.number().int().positive(),
  supportedQuestionTypes: z.array(QuestionTypeSchema),
});

export const QuestionBankSchema = z.object({
  meta: QuestionBankMetaSchema,
  categories: z.array(CategorySchema).min(1),
});

export type QuestionBank = z.infer<typeof QuestionBankSchema>;

export interface EnrichedQuestion extends RawQuestion {
  categoryId: string;
  categoryCode: string;
  categorySlug: string;
  categoryTitleDe: string;
  categoryTitleAr: string;
  subcategoryId: string;
  subcategorySlug: string;
  subcategoryTitleDe: string;
  subcategoryTitleAr: string;
  instructionsDe: string;
  recommendedSubcategoryTimeMinutes: number;
}

// ============================================================================
// Study Guides Schema (`data/guides.json`)
// ============================================================================

export const GuideStepSchema = z.object({
  step: z.number().int().positive(),
  de: z.string().min(1),
  ar: z.string().min(1),
});

export type GuideStep = z.infer<typeof GuideStepSchema>;

export const GuideExamTrapSchema = z.object({
  de: z.string().min(1),
  ar: z.string().min(1),
});

export type GuideExamTrap = z.infer<typeof GuideExamTrapSchema>;

export const GuideWorkedExampleSchema = z.object({
  difficulty: z.string().min(1),
  problemDe: z.string().min(1),
  answerDe: z.string().min(1),
  stepsDe: z.string().min(1),
  stepsAr: z.string().min(1),
});

export type GuideWorkedExample = z.infer<typeof GuideWorkedExampleSchema>;

export const StudyGuideSchema = z.object({
  id: z.string().min(1),
  subcategoryId: z.string().min(1),
  categoryId: z.string().min(1),
  categoryCode: z.string().min(1),
  categoryTitleDe: z.string().min(1),
  categoryTitleAr: z.string().min(1),
  slug: z.string().min(1),
  titleDe: z.string().min(1),
  titleAr: z.string().min(1),
  questionCount: z.number().int().positive(),
  recommendedTimeMinutes: z.number().positive(),
  practiceHref: z.string().min(1),
  coreRuleDe: z.string().min(1),
  coreRuleAr: z.string().min(1),
  steps: z.array(GuideStepSchema).min(1),
  examTraps: z.array(GuideExamTrapSchema).min(1),
  examples: z.array(GuideWorkedExampleSchema).min(1),
});

export type StudyGuide = z.infer<typeof StudyGuideSchema>;

export const GuidesBankMetaSchema = z.object({
  title: z.string().min(1),
  version: z.string().min(1),
  uiLanguage: z.string().min(1),
  contentLanguages: z.array(z.string()).min(1),
  totalGuides: z.number().int().positive(),
  totalWorkedExamples: z.number().int().positive(),
});

export const GuidesBankSchema = z.object({
  meta: GuidesBankMetaSchema,
  guides: z.array(StudyGuideSchema).min(1),
});

export type GuidesBank = z.infer<typeof GuidesBankSchema>;
