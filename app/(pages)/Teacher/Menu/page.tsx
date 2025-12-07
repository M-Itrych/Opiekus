"use client";

import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";
import MealPlanView from "@/app/components/teacher/Menu/MealPlanView";

export default function Menu() {
  return (
    <TeacherLayout
      title="Jadłospis"
      description="Przeglądanie jadłospisów przedszkolnych"
    >
      <MealPlanView />
    </TeacherLayout>
  );
}
