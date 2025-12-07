"use client";

import WhistleblowerList from "@/app/components/headteacher/Whistleblower/WhistleblowerList";
import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";

export default function WhistleblowerPage() {
  return (
    <HeadTeacherLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Sygnaliści
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Zarządzanie zgłoszeniami zgodnie z ustawą o ochronie sygnalistów
            </p>
          </div>
          <WhistleblowerList />
        </div>
      </div>
    </HeadTeacherLayout>
  );
}

