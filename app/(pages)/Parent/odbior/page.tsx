"use client";

import PersonList from "@/app/components/parent/AuthorizedPersons/PersonList";

export default function OdbiorPage() {
  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Osoby upoważnione do odbioru
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Zarządzaj listą osób, które mogą odbierać Twoje dziecko z przedszkola
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-4 sm:p-6">
          <PersonList />
        </div>
      </div>
    </div>
  );
}

