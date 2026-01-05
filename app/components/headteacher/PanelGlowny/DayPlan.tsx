"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import HeadTeacherCard from "./HeadTeacherCard";
import { Button } from "@/components/ui/button";




export default function DayPlan({ upcomingEvents }: { upcomingEvents: { title: string; date: string; time: string; description: string }[] }) {
  return (
    <section className="flex w-full flex-col gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white px-3 sm:px-4 md:px-6 py-4 sm:py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Plan dnia
          </h2>
          <Button
            asChild
            variant="outline"
            className="flex items-center justify-between gap-2 px-3 sm:px-4 text-xs sm:text-sm w-full sm:w-auto"
          >
            <Link href="/HeadTeacher/Calendar" className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm text-black hover:text-sky-500">
                <span className="hidden sm:inline">Przejdź do kalendarza</span>
                <span className="sm:hidden">Kalendarz</span>
              </span>
              <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </div>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Kluczowe wydarzenia i spotkania zaplanowane na dziś.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {upcomingEvents.length === 0 ? (
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 col-span-full text-center py-6 sm:py-8">
            Brak nadchodzących wydarzeń
          </p>
        ) : (
          upcomingEvents.map((event) => (
            <HeadTeacherCard
              key={`${event.title}-${event.time}`}
              title={event.title}
              date={event.date}
              time={event.time}
              description={event.description}
            />
          ))
        )}
      </div>
    </section>
  );
}