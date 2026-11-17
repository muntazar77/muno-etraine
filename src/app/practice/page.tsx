import * as React from "react";
import { getQuestionBank } from "@/lib/questions";
import { PracticeClient } from "@/components/exam/PracticeClient";

export const metadata = {
  title: "Practice Questions",
};

export default function PracticePage() {
  const bank = getQuestionBank();

  return (
    <React.Suspense
      fallback={
        <div className="py-16 text-center text-sm text-[var(--ink-secondary)]">
          Übungsmodus wird geladen…
        </div>
      }
    >
      <PracticeClient categories={bank.categories} />
    </React.Suspense>
  );
}
