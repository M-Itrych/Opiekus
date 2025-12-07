"use client";

import ConsentsManagement from "@/app/components/parent/Consents/ConsentsManagement";

export default function ZgodyPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Zgody RODO
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Zarządzaj zgodami na przetwarzanie danych Twojego dziecka
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
          <ConsentsManagement />
        </div>
      </div>
    </div>
  );
}

