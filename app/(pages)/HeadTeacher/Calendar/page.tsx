"use client";

import { useState, useEffect, useCallback } from "react";
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
import { CalendarModal } from "@/app/components/headteacher/calendar/CalendarModal";
import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";

interface Event {
  id: string;
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

interface AnnouncementResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  createdAt: string;
  targetGroup?: string | null;
  author?: {
    name: string | null;
    surname: string | null;
  } | null;
  group?: {
    id: string;
    name: string | null;
  } | null;
}

type CategoryConfig = {
  label: Event["category"];
  color: string;
  icon: React.ElementType;
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  FESTIWAL: { label: "festiwal", color: "border-orange-300", icon: PartyPopper },
  WYCIECZKA: { label: "wycieczka", color: "border-emerald-300", icon: MapPin },
  URODZINY: { label: "urodziny", color: "border-pink-300", icon: PartyPopper },
  PRZEDSTAWIENIE: { label: "przedstawienie", color: "border-purple-300", icon: BookOpen },
  ZAJECIA: { label: "zajęcia", color: "border-indigo-300", icon: BookOpen },
};

const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  label: "inne",
  color: "border-zinc-200",
  icon: CalendarIcon,
};

const AUDIENCE_LABELS: Record<string, string> = {
  ALL: "Wszyscy",
  TEACHERS: "Nauczyciele",
  PARENTS: "Rodzice",
};

const mapAnnouncementToEvent = (announcement: AnnouncementResponse): Event => {
  const config =
    CATEGORY_CONFIG[announcement.category as keyof typeof CATEGORY_CONFIG] ?? DEFAULT_CATEGORY_CONFIG;
  const baseStart =
    announcement.startTime ?? announcement.eventDate ?? announcement.createdAt;
  const startDate = baseStart ? new Date(baseStart) : new Date();
  const endDate = announcement.endTime ? new Date(announcement.endTime) : null;
  const timeLabel = endDate
    ? `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`
    : format(startDate, "HH:mm");
  const audienceLabel = announcement.targetGroup
    ? AUDIENCE_LABELS[announcement.targetGroup] || announcement.targetGroup
    : null;
  const participants =
    announcement.group?.name?.trim() ||
    audienceLabel ||
    (announcement.author
      ? [announcement.author.name, announcement.author.surname].filter(Boolean).join(" ").trim()
      : "") ||
    undefined;

  return {
    id: announcement.id,
    title: announcement.title,
    description: announcement.content,
    date: startDate,
    time: timeLabel,
    location: announcement.location ?? "Brak lokalizacji",
    category: config.label,
    participants: participants || undefined,
    color: config.color,
    icon: config.icon,
  };
};

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setEventsError(null);
      setIsLoadingEvents(true);
      const response = await fetch("/api/announcements", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data: AnnouncementResponse[] = await response.json();
      setEvents(data.map(mapAnnouncementToEvent));
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      setEvents([]);
      setEventsError("Nie udało się pobrać wydarzeń. Spróbuj ponownie później.");
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date));
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  return (
    <HeadTeacherLayout
      title="Wydarzenia"
      description="Plan wydarzeń przedszkolnych"
      headerAction={
        <div className="flex items-center gap-2">
          <CalendarModal onEventCreated={fetchEvents} />
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
      }
    >

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

            {eventsError ? (
              <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
                <h3 className="text-lg font-semibold text-red-800">Błąd ładowania wydarzeń</h3>
                <p className="text-sm text-red-700">{eventsError}</p>
              </section>
            ) : isLoadingEvents ? (
              <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-200 bg-white p-12 shadow-sm">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                <p className="text-sm text-zinc-500">Ładuję wydarzenia...</p>
              </section>
            ) : selectedDateEvents.length === 0 ? (
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
    </HeadTeacherLayout>
  );
}