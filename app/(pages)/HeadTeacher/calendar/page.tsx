"use client";

import NavbarHeadteacher from "@/app/components/global/NavBar/variants/navbar_headteacher";
import Topbar from "@/app/components/global/TopBar/topbar";
import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  category: "festiwal" | "wycieczka" | "urodziny" | "przedstawienie" | "zajęcia" | "inne";
  participants?: string;
  color: string;
  icon: React.ElementType;
}

const mockEvents: Event[] = [
  {
    id: 1,
    title: "Spotkanie z rodzicami",
    description: "Omówienie wyników śródrocznych i planów na kolejny semestr.",
    date: new Date(2025, 10, 11),
    time: "10:00",
    location: "Sala konferencyjna",
    category: "inne",
    participants: "Rodzice i nauczyciele",
    color: "border-blue-300",
    icon: Users,
  },
  {
    id: 2,
    title: "Rada pedagogiczna",
    description: "Podsumowanie pierwszego półrocza oraz planowanie szkoleń.",
    date: new Date(2025, 10, 11),
    time: "14:00",
    location: "Sala nauczycielska",
    category: "zajęcia",
    participants: "Wszyscy nauczyciele",
    color: "border-indigo-300",
    icon: BookOpen,
  },
  {
    id: 3,
    title: "Dzień otwarty",
    description: "Prezentacja oferty szkoły dla nowych rodziców i uczniów.",
    date: new Date(2025, 10, 11),
    time: "16:00",
    location: "Główny hall szkoły",
    category: "festiwal",
    participants: "Wszyscy zainteresowani",
    color: "border-orange-300",
    icon: PartyPopper,
  },
];

export default function HeadTeacher() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return mockEvents.filter((event) => isSameDay(event.date, date));
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-zinc-50">
      <NavbarHeadteacher />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pt-[64px] ml-[80px]">
        <Topbar />
        <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">
                Wydarzenia
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Plan wydarzeń przedszkolnych
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedDate(new Date());
                setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
              }}
              className="bg-sky-500 text-white px-4 py-2 hover:bg-sky-600 transition-colors flex items-center gap-2 shadow-sm"
            >
              <CalendarIcon className="h-4 w-4" />
              Dzisiaj
            </Button>
          </div>

          <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={goToPreviousWeek}
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-zinc-600" />
              </button>
              <h2 className="text-base font-semibold text-zinc-900 capitalize">
                {format(weekStart, "LLLL yyyy", { locale: pl })}
              </h2>
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-zinc-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysOfWeek().map((day, index) => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const hasEvents = getEventsForDate(day).length > 0;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                      isSelected
                        ? "bg-sky-500 text-white shadow-md scale-105"
                        : isToday
                        ? "bg-zinc-100 border-2 border-sky-500 text-sky-600"
                        : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    <span className="text-xs font-medium uppercase mb-1">
                      {format(day, "EEE", { locale: pl })}
                    </span>
                    <span className="text-lg font-bold mb-1">
                      {format(day, "d")}
                    </span>
                    {hasEvents && (
                      <div className="flex gap-0.5">
                        {getEventsForDate(day)
                          .slice(0, 3)
                          .map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 w-1 rounded-full ${
                                isSelected ? "bg-white" : "bg-sky-500"
                              }`}
                            />
                          ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 capitalize">
                {format(selectedDate, "EEEE, d MMMM yyyy", { locale: pl })}
              </h2>
              {selectedDateEvents.length > 0 && (
                <span className="bg-sky-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                  {selectedDateEvents.length}{" "}
                  {selectedDateEvents.length === 1 ? "wydarzenie" : "wydarzenia"}
                </span>
              )}
            </div>

            {selectedDateEvents.length === 0 ? (
              <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-200 bg-white p-12 shadow-sm">
                <CalendarIcon className="h-16 w-16 text-zinc-300" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    Brak wydarzeń
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Nie ma żadnych zaplanowanych wydarzeń na ten dzień.
                  </p>
                </div>
              </section>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {selectedDateEvents.map((event) => {
                  const IconComponent = event.icon;
                  return (
                    <section
                      key={event.id}
                      className={`flex flex-col gap-4 rounded-2xl border-2 ${event.color} bg-white p-6 shadow-sm transition-shadow hover:shadow-md`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-zinc-100">
                          <IconComponent className="h-6 w-6 text-zinc-700" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold text-zinc-900">
                              {event.title}
                            </h3>
                            <span className="text-xs font-medium text-zinc-500 uppercase bg-zinc-100 px-2 py-1 rounded">
                              {event.category}
                            </span>
                          </div>
                          <p className="text-zinc-600 mb-4 leading-relaxed">
                            {event.description}
                          </p>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="flex items-center gap-2 text-sm text-zinc-600">
                              <Clock className="h-4 w-4 text-sky-500" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-600">
                              <MapPin className="h-4 w-4 text-sky-500" />
                              <span>{event.location}</span>
                            </div>
                            {event.participants && (
                              <div className="flex items-center gap-2 text-sm text-zinc-600">
                                <Users className="h-4 w-4 text-sky-500" />
                                <span>{event.participants}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}