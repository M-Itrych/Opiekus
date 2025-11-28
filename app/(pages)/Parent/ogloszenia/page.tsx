'use client';

import AnnouncementFeed from "@/app/components/announcements/AnnouncementFeed";
import { Bell } from "lucide-react";

export default function ParentAnnouncementsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-sky-100 p-2 text-sky-600">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Ogłoszenia</h1>
            <p className="text-sm text-gray-600">
              Aktualne informacje i komunikaty skierowane do rodziców.
            </p>
          </div>
        </div>
      </header>

      <AnnouncementFeed emptyMessage="Brak ogłoszeń skierowanych do rodziców." />
    </div>
  );
}

