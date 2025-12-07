"use client";

import GroupChildren from "@/app/components/teacher/PanelGlowny/GroupChildren";
import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";

export default function Group() {
  return (
    <TeacherLayout
      title="Moja grupa"
      description="Lista dzieci w grupie z informacjami o zgodach i upoważnieniach"
    >
      <GroupChildren groupName="Moja grupa" />
    </TeacherLayout>
  );
}
