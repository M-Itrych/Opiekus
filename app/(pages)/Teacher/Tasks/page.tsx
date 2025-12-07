"use client";

import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";
import TeacherTasksList from "@/app/components/teacher/Tasks/TeacherTasksList";

export default function Tasks() {
  return (
    <TeacherLayout
      title="Zadania"
      description="Twoje zadania i obowiązki"
    >
      <TeacherTasksList />
    </TeacherLayout>
  );
}

