---
name: exam-engine-testing
description: >
  Testing and verification standards for the Muno eTrainer exam engine, practice mode, timer behavior,
  question deduplication, answer evaluation, localStorage persistence, and visual verification.
---

# Exam Engine & Testing Standards — Muno eTrainer

## 1. Core Exam Engine Invariants

1. **Strict Exam Confidentiality**: In Exam Simulator mode, NEVER reveal whether an answer is right or wrong, nor display `explanationDe`/`explanationAr`, until the exam is submitted.
2. **State Preservation Across Navigation**: Navigating via `First`, `Back`, `Next`, `Last`, or the numbered question grid must preserve all selected answers, text inputs, bookmarks, and review flags.
3. **Question Navigator Filters**:
   - `View Bookmarked`: Filters or highlights bookmarked questions in the current exam.
   - `View Unanswered`: Filters or jumps to unanswered questions so candidates can complete gaps before submitting.
   - `Save for Revision` (Mark for Review): Flags the current question for review with a distinct visual indicator in the numbered navigator.
4. **Timer & Safe Auto-Submission**:
   - Circular countdown timer displays remaining `MM:SS` (or `HH:MM:SS`) and progresses smoothly.
   - When the timer reaches `0:00`, the exam automatically submits once and transitions cleanly to the Exam Results view without losing any recorded answers.
5. **Manual Submission Confirmation**:
   - Clicking `Submit Exam` opens a native modal `<dialog>` (`showModal()`) summarizing answered, unanswered, and flagged-for-review counts so the user can either return to unanswered questions or confirm final submission.

## 2. Automated & Visual Verification Suite

- **Unit & Integration Tests (Vitest)**:
  - Validate all 683 questions in `data/questions.json` against `QuestionBankSchema`.
  - Verify zero duplicate IDs across all generated exam presets (Full Mock Exam, Category Exam, Subcategory Exam, Weak Areas Exam).
  - Test `evaluateAnswer()` across all 4 question types (`multiple-choice`, `multi-select`, `boolean-choice`, and `text-input` including arithmetic, fractions, `1.3` operators, `1.9` geometry multi-fields, and `1.11` decimal interest values).
  - Test score calculation, category breakdown, mistake tracking, and localStorage persistence.
- **Visual & Interactive Browser Verification**:
  - Inspect live rendered screenshots of Dashboard and Exam Simulator against `design/references/dashboard-reference.png` and `design/references/exam-reference.png` across desktop and mobile viewports.
