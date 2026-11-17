import * as React from "react";
import { getAllGuides } from "@/lib/guides";
import { getQuestionBank } from "@/lib/questions";
import { LernhilfenClient } from "@/components/guides/LernhilfenClient";

export default function LernhilfenPage() {
  const guides = getAllGuides();
  const bank = getQuestionBank();

  return (
    <React.Suspense
      fallback={
        <div className="py-16 text-center text-sm text-[var(--ink-secondary)]">
          Lernhilfen werden geladen…
        </div>
      }
    >
      <LernhilfenClient guides={guides} categories={bank.categories} />
    </React.Suspense>
  );
}
