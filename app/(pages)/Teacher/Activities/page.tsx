"use client";

import DailyActivities from "@/app/components/teacher/PanelGlowny/DailyActivities";
import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";

export default function Activities() {
  return (
    <TeacherLayout
      title="Aktywności dzienne"
      description="Ewidencja posiłków, snu i aktywności dzieci"
    >
      <DailyActivities />
    </TeacherLayout>
  );
}
