---
name: question-bank-integrity
description: >
  Guarantees 100% fidelity, Zod schema validation, and accurate multi-type evaluation for the
  683 German/Arabic Einstellungstest questions across 6 categories and 32 subcategories in data/questions.json.
---

# Question-Bank Integrity — Muno eTrainer

## 1. Source of Truth

The canonical dataset lives at `data/questions.json`:
- **Total Categories**: 6 (`cat-1` through `cat-6`)
- **Total Subcategories**: 32 (`1.1` through `6.1`)
- **Total Questions**: 683 unique questions
- **Supported Question Types**:
  - `multiple-choice` (543 questions — single correct option key `A`, `B`, `C`, `D`, etc.)
  - `text-input` (118 questions — arithmetic, fractions, equations, operator blanks `1.3`, geometry multi-blanks `1.9`, interest calculations `1.11`)
  - `boolean-choice` (20 questions — e.g. `A: Tatsache`, `B: Meinung`)
  - `multi-select` (2 questions — multiple correct option keys e.g. `["C", "D"]`)

## 2. Integrity & Validation Rules

1. **Zero Fabrication or Mutation**: Never alter or drop questions from `data/questions.json`. Validate the entire file against a strict Zod schema (`QuestionBankSchema`).
2. **No Duplicate Questions in Sessions**: Any exam or practice generator must deduplicate by `question.id` (`Set<string>`) using deterministic or Fisher-Yates shuffling.
3. **Accurate Multi-Type Answer Evaluation**:
   - `multiple-choice` & `boolean-choice`: Compare selected key (e.g. `"B"`) against `correctAnswers[0]`.
   - `multi-select`: Require exact set equality between sorted user-selected keys and sorted `correctAnswers`.
   - `text-input`:
     - **Subcategory `1.3` (Operator Blanks `___`)**: Normalize `*`, `x`, `X` → `×` and `/`, `:` → `÷`; compare the pair of operators (`"-, +"`, `"×, +"`, etc.).
     - **Subcategory `1.9` (Geometry Multi-Field Blanks)**: Parse `Label: Value` pairs separated by `|` (e.g. `"Seite b: 10 | Flächeninhalt: 60"`). Accept either labeled fields from the structured UI or ordered values separated by `|` / `,` / `;`, normalizing decimal commas and dots.
     - **Numeric / Fraction / Standard Text Inputs**: Trim whitespace, strip optional trailing units (`€`, `%`, `Tage`, `Monate`), normalize German decimal commas (`30397,19` ↔ `30397.19`), and handle trailing decimal zeros (`1312,50` ↔ `1312,5`).
4. **Bilingual Support**: Preserve both `titleDe`/`titleAr`, `instructionsDe`, and `explanationDe`/`explanationAr`. Render Arabic text with `dir="rtl"` and `lang="ar"`.
