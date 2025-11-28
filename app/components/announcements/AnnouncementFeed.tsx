"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Loader2, Megaphone, CalendarDays, Clock, MapPin, Users } from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: string;
  targetGroup: string | null;
  location: string | null;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  author?: {
    name: string | null;
    surname: string | null;
  } | null;
}

interface AnnouncementFeedProps {
  emptyMessage?: string;
}

const audienceLabels: Record<string, string> = {
  ALL: "Wszyscy",
  TEACHERS: "Nauczyciele",
  PARENTS: "Rodzice",
};

const formatDate = (value: string | null) =>
  value ? format(new Date(value), "d MMM yyyy", { locale: pl }) : "Brak daty";

const formatTimeRange = (start: string | null, end: string | null) => {
  if (!start) return "Brak godziny";
  const startLabel = format(new Date(start), "HH:mm");
  if (!end) return `${startLabel}`;
  const endLabel = format(new Date(end), "HH:mm");
  return `${startLabel} - ${endLabel}`;
};

export default function AnnouncementFeed({ emptyMessage }: AnnouncementFeedProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/announcements", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch announcements");
      const data: AnnouncementItem[] = await response.json();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać ogłoszeń. Spróbuj ponownie później.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500 shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Ładowanie ogłoszeń...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-600 shadow-sm">
        <Megaphone className="h-6 w-6" />
        <p>{error}</p>
      </section>
    );
  }

  if (announcements.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center text-zinc-500 shadow-sm">
        <Megaphone className="h-8 w-8 text-zinc-400" />
        <p>{emptyMessage ?? "Brak ogłoszeń do wyświetlenia."}</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {announcements.map((announcement) => (
        <article
          key={announcement.id}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-zinc-900">{announcement.title}</h3>
                {announcement.targetGroup && (
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600">
                    {audienceLabels[announcement.targetGroup] ||
                      announcement.targetGroup}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Dodano {formatDate(announcement.createdAt)}
                {announcement.author?.name && (
                  <> przez {announcement.author.name} {announcement.author?.surname}</>
                )}
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-zinc-700">{announcement.content}</p>

          <div className="grid gap-3 text-sm text-zinc-600 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-sky-500" />
              <span>{formatDate(announcement.eventDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-500" />
              <span>{formatTimeRange(announcement.startTime, announcement.endTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-500" />
              <span>{announcement.location || "Brak lokalizacji"}</span>
            </div>
          </div>

          {announcement.targetGroup && announcement.targetGroup !== "ALL" && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Users className="h-4 w-4" />
              <span>Odbiorcy: {audienceLabels[announcement.targetGroup]}</span>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

