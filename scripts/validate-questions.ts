import { getAllQuestions, getQuestionBank } from "../src/lib/questions.ts";

const bank = getQuestionBank();
const questions = getAllQuestions();

console.log(`✓ Validated "${bank.meta.title}" (v${bank.meta.version})`);
console.log(`  Categories:    ${bank.categories.length}`);
console.log(`  Subcategories: ${bank.meta.totalSubcategories}`);
console.log(`  Questions:     ${questions.length}`);
