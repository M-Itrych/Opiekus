"use client";

import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";
import MessagesInbox from "@/app/components/teacher/Messages/MessagesInbox";

export default function Messages() {
  return (
    <TeacherLayout
      title="Wiadomości"
      description="Komunikacja z rodzicami i personelem"
    >
      <MessagesInbox />
    </TeacherLayout>
  );
}
