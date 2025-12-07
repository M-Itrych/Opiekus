"use client";

import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";
import TrainingList from "@/app/components/teacher/Training/TrainingList";

export default function Training() {
  return (
    <TeacherLayout
      title="Szkolenia"
      description="Moduły edukacyjne i szkolenia dla nauczycieli"
    >
      <TrainingList />
    </TeacherLayout>
  );
}
