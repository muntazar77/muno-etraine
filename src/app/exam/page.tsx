import * as React from "react";
import { getQuestionBank } from "@/lib/questions";
import { ExamSimulatorClient } from "@/components/exam/ExamSimulatorClient";

export const metadata = {
  title: "Exam Simulator",
};

export default function ExamPage() {
  const bank = getQuestionBank();

  return (
    <React.Suspense
      fallback={
        <div className="py-16 text-center text-sm text-[var(--ink-secondary)]">
          Prüfungssimulator wird geladen…
        </div>
      }
    >
      <ExamSimulatorClient categories={bank.categories} />
    </React.Suspense>
  );
}
