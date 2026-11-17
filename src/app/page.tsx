import { getQuestionBank } from "@/lib/questions";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function DashboardPage() {
  const bank = getQuestionBank();

  return (
    <DashboardClient
      categories={bank.categories}
      totalQuestions={bank.meta.totalQuestions}
      totalSubcategories={bank.meta.totalSubcategories}
    />
  );
}
