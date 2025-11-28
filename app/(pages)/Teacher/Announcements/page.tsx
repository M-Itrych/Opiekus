"use client";

import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";
import AnnouncementFeed from "@/app/components/announcements/AnnouncementFeed";

export default function Announcements() {
  return (
    <TeacherLayout
      title="Ogłoszenia"
      description="Przeglądanie ogłoszeń przedszkolnych"
    >
      <AnnouncementFeed emptyMessage="Brak ogłoszeń skierowanych do nauczycieli." />
    </TeacherLayout>
  );
}

