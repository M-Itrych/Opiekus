"use client";

import { ChevronRight } from "lucide-react";
import HeadTeacherCard from "./HeadTeacherCard";
import { Button } from "@/components/ui/button";




export default function DayPlan({ upcomingEvents }: { upcomingEvents: { title: string; date: string; time: string; description: string }[] }) {
  return (
    <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Plan dnia
            </h2>
            <Button
                asChild
                variant="outline"
                className="flex items-center justify-between gap-2 px-4"
            >
                <a href="/HeadTeacher/calendar" className="flex items-center gap-2">
                    <span className="text-sm text-black hover:text-sky-500">
                        Przejdz do kalendarza
                    </span>
                    <ChevronRight className="ml-2 h-4 w-4" />
                </a>
            </Button>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Kluczowe wydarzenia i spotkania zaplanowane na dziś.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {upcomingEvents.map((event) => (
          <HeadTeacherCard
            key={`${event.title}-${event.time}`}
            title={event.title}
            date={event.date}
            time={event.time}
            description={event.description}
          />
        ))}
      </div>
    </section>
  );
}