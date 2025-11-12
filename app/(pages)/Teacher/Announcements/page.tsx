"use client";

import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";

export default function Announcements() {
  return (
    <TeacherLayout
      title="Ogłoszenia"
      description="Przeglądanie ogłoszeń przedszkolnych"
    >
      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Dostępne ogłoszenia
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              Tutaj będą wyświetlane ogłoszenia
            </p>
          </div>
        </div>
      </section>
    </TeacherLayout>
  );
}

