"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Loader2,
  Megaphone,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Audience = "ALL" | "TEACHERS" | "PARENTS";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: string;
  targetGroup: Audience | null;
  location: string | null;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementFormState {
  title: string;
  content: string;
  location: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  audience: Audience;
}

type FilterValue = "everyone" | "teachers" | "parents";

const audienceOptions: Record<Audience, string> = {
  ALL: "Wszyscy",
  TEACHERS: "Dla nauczycieli",
  PARENTS: "Dla rodziców",
};

const filterToQuery: Record<FilterValue, Audience | null> = {
  everyone: null,
  teachers: "TEACHERS",
  parents: "PARENTS",
};

const categoryOptions = [
  { value: "INNE", label: "Inne" },
  { value: "WYJSCIE", label: "Wyjście" },
  { value: "WYCIECZKA", label: "Wycieczka" },
  { value: "SPOTKANIE", label: "Spotkanie" },
  { value: "ORGANIZACYJNE", label: "Organizacyjne" },
  { value: "FESTIWAL", label: "Festiwal" },
  { value: "URODZINY", label: "Urodziny" },
  { value: "PRZEDSTAWIENIE", label: "Przedstawienie" },
  { value: "ZAJECIA", label: "Zajęcia" },
];

const defaultFormState: AnnouncementFormState = {
  title: "",
  content: "",
  location: "",
  category: "INNE",
  date: "",
  startTime: "",
  endTime: "",
  audience: "ALL",
};

const formatDateTime = (date: string | null) =>
  date ? format(new Date(date), "d MMM yyyy", { locale: pl }) : "Brak daty";

const formatTime = (start: string | null, end: string | null) => {
  if (!start) return "Brak godziny";
  const startLabel = format(new Date(start), "HH:mm");
  if (!end) return `${startLabel}`;
  const endLabel = format(new Date(end), "HH:mm");
  return `${startLabel} - ${endLabel}`;
};

interface AnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: AnnouncementItem | null;
  onSubmit: (payload: AnnouncementFormState, announcementId?: string) => Promise<void>;
  isSubmitting: boolean;
}

function AnnouncementModal({
  open,
  onClose,
  mode,
  initialData,
  onSubmit,
  isSubmitting,
}: AnnouncementModalProps) {
  const [formState, setFormState] = useState<AnnouncementFormState>(defaultFormState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setFormState({
        title: initialData.title,
        content: initialData.content,
        location: initialData.location || "",
        category: initialData.category || "INNE",
        date: initialData.eventDate
          ? format(new Date(initialData.eventDate), "yyyy-MM-dd")
          : "",
        startTime: initialData.startTime
          ? format(new Date(initialData.startTime), "HH:mm")
          : "",
        endTime: initialData.endTime ? format(new Date(initialData.endTime), "HH:mm") : "",
        audience: (initialData.targetGroup as Audience) || "ALL",
      });
    } else {
      setFormState(defaultFormState);
    }
    setError(null);
  }, [open, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.content.trim()) {
      setError("Podaj tytuł i treść ogłoszenia");
      return;
    }
    setError(null);
    await onSubmit(formState, initialData?.id);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-zinc-900">
              {mode === "create" ? "Dodaj ogłoszenie" : "Edytuj ogłoszenie"}
            </h3>
            <p className="text-sm text-zinc-500">
              {mode === "create"
                ? "Wypełnij formularz, aby opublikować nowe ogłoszenie."
                : "Zaktualizuj szczegóły istniejącego ogłoszenia."}
            </p>
          </div>
          <button
            aria-label="Zamknij"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          <div>
            <label className="text-sm font-medium text-zinc-700">
              Temat <span className="text-red-500">*</span>
            </label>
            <Input
              name="title"
              value={formState.title}
              onChange={handleChange}
              placeholder="Np. Zebranie z rodzicami"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">
              Treść <span className="text-red-500">*</span>
            </label>
            <Textarea
              name="content"
              value={formState.content}
              onChange={handleChange}
              rows={4}
              placeholder="Opisz szczegóły ogłoszenia..."
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-zinc-700">Kategoria</label>
              <Select
                value={formState.category}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">
                Odbiorcy ogłoszenia
              </label>
              <Select
                value={formState.audience}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, audience: value as Audience }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Wybierz odbiorców" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(audienceOptions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-zinc-700">Data</label>
              <Input
                type="date"
                name="date"
                value={formState.date}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">
                Godzina rozpoczęcia
              </label>
              <Input
                type="time"
                name="startTime"
                value={formState.startTime}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Godzina zakończenia</label>
              <Input
                type="time"
                name="endTime"
                value={formState.endTime}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Lokalizacja</label>
            <Input
              name="location"
              value={formState.location}
              onChange={handleChange}
              placeholder="Np. Sala gimnastyczna"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisuję..." : "Zapisz ogłoszenie"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AnnouncementsBoard() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("everyone");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editItem, setEditItem] = useState<AnnouncementItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const audienceQuery = filterToQuery[filter];
      const url = audienceQuery
        ? `/api/announcements?audience=${audienceQuery}`
        : "/api/announcements";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }
      const data: AnnouncementItem[] = await response.json();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać ogłoszeń. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const openCreateModal = () => {
    setEditItem(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditItem(item);
    setModalMode("edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
  };

  const handleSubmit = async (
    payload: AnnouncementFormState,
    announcementId?: string
  ) => {
    setSubmitting(true);
    const body: Record<string, unknown> = {
      title: payload.title,
      content: payload.content,
      category: payload.category,
      location: payload.location,
      audience: payload.audience,
    };

    if (payload.date) {
      body.eventDate = new Date(payload.date).toISOString();
    }
    if (payload.date && payload.startTime) {
      body.startTime = new Date(`${payload.date}T${payload.startTime}`).toISOString();
    } else if (payload.startTime) {
      body.startTime = new Date(`1970-01-01T${payload.startTime}`).toISOString();
    }
    if (payload.date && payload.endTime) {
      body.endTime = new Date(`${payload.date}T${payload.endTime}`).toISOString();
    } else if (payload.endTime) {
      body.endTime = new Date(`1970-01-01T${payload.endTime}`).toISOString();
    }

    try {
      const response = await fetch(
        announcementId ? `/api/announcements/${announcementId}` : "/api/announcements",
        {
          method: announcementId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Błąd zapisu ogłoszenia");
      }

      closeModal();
      await fetchAnnouncements();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć to ogłoszenie?")) return;
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Błąd podczas usuwania ogłoszenia");
      }
      await fetchAnnouncements();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    }
  };

  const visibleAnnouncements = useMemo(() => announcements, [announcements]);

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Dostępne ogłoszenia</h2>
          <p className="text-sm text-zinc-500">
            Zarządzaj komunikatami kierowanymi do nauczycieli i rodziców.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["everyone", "teachers", "parents"] as FilterValue[]).map((value) => (
            <Button
              key={value}
              variant={filter === value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(value)}
            >
              {value === "everyone"
                ? "Wszystkie"
                : value === "teachers"
                ? "Dla nauczycieli"
                : "Dla rodziców"}
            </Button>
          ))}
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Dodaj ogłoszenie
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Ładowanie ogłoszeń...
        </div>
      ) : visibleAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 px-6 py-12 text-center text-zinc-500">
          <Megaphone className="h-10 w-10 text-zinc-400" />
          <p>Brak ogłoszeń dla wybranych odbiorców.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-zinc-900">
                      {announcement.title}
                    </h3>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600">
                      {audienceOptions[announcement.targetGroup ?? "ALL"]}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500">
                    Opublikowano {formatDateTime(announcement.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => openEditModal(announcement)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edytuj
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Usuń
                  </Button>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-zinc-700">
                {announcement.content}
              </p>
              <div className="grid gap-4 text-sm text-zinc-600 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-sky-500" />
                  <span>{formatDateTime(announcement.eventDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-500" />
                  <span>{formatTime(announcement.startTime, announcement.endTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-500" />
                  <span>{announcement.location || "Brak lokalizacji"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnnouncementModal
        open={modalOpen}
        onClose={closeModal}
        mode={modalMode}
        initialData={editItem}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />
    </section>
  );
}

