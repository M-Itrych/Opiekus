"use client";

import PickupControl from "@/app/components/teacher/PanelGlowny/PickupControl";
import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";

export default function Pickup() {
  return (
    <TeacherLayout
      title="Kontrola odbioru dzieci"
      description="Weryfikacja tożsamości i odbiór dzieci przez upoważnione osoby"
    >
      <PickupControl />
    </TeacherLayout>
  );
}
