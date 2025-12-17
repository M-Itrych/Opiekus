"use client";

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
} from "react";
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
import {
  Search,
  Home,
  Plus,
  Edit,
  Calendar,
  Users,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { useModal } from "@/app/components/global/Modal/ModalContext";

type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

interface Room {
  id: string;
  name: string;
  capacity: number;
  status: RoomStatus;
  description?: string | null;
  group?: { id: string; name: string } | null;
}

const STATUS_META: Record<
  RoomStatus,
  { label: string; badgeClass: string }
> = {
  AVAILABLE: {
    label: "Dostępna",
    badgeClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  OCCUPIED: {
    label: "Zajęta",
    badgeClass: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  },
  MAINTENANCE: {
    label: "Konserwacja",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

const defaultFormState = {
  name: "",
  capacity: "",
  status: "AVAILABLE" as RoomStatus,
  equipment: "",
};

export default function RoomsList() {
  const { showModal } = useModal();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formValues, setFormValues] = useState(defaultFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/rooms");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Nie udało się pobrać sal");
      }
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const term = searchQuery.toLowerCase();
      return (
        room.name.toLowerCase().includes(term) ||
        room.group?.name?.toLowerCase().includes(term)
      );
    });
  }, [rooms, searchQuery]);

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormValues(defaultFormState);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormValues({
      name: room.name,
      capacity: String(room.capacity),
      status: room.status,
      equipment: room.description || "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setFormValues(defaultFormState);
    setFormError(null);
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!formValues.name.trim() || !formValues.capacity.trim()) {
      setFormError("Uzupełnij nazwę oraz pojemność sali.");
      return;
    }

    const payload = {
      name: formValues.name.trim(),
      capacity: Number(formValues.capacity),
      status: formValues.status,
      description: formValues.equipment.trim(),
    };

    if (!Number.isFinite(payload.capacity) || payload.capacity <= 0) {
      setFormError("Pojemność musi być dodatnią liczbą.");
      return;
    }

    setFormLoading(true);

    try {
      const endpoint = editingRoom ? `/api/rooms/${editingRoom.id}` : "/api/rooms";
      const method = editingRoom ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Operacja nie powiodła się");
      }

      await fetchRooms();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (room: Room) => {
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć salę "${room.name}"?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Nie udało się usunąć sali");
      }
      await fetchRooms();
    } catch (err) {
      showModal('error', err instanceof Error ? err.message : 'Nieznany błąd');
    }
  };

  const renderEquipment = (description?: string | null) => {
    const items =
      description
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) ?? [];

    if (!items.length) {
      return (
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Brak informacji o wyposażeniu
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Zarządzanie salami
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Rezerwacja sal, harmonogram wykorzystania, konserwacja i wyposażenie
          </p>
        </div>
        <Button className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Dodaj salę
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder="Szukaj sal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Ładowanie sal...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredRooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
              Brak sal spełniających kryteria wyszukiwania.
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
                      <Home className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {room.name}
                      </h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Pojemność: {room.capacity} osób
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_META[room.status].badgeClass
                      }`}
                  >
                    {STATUS_META[room.status].label}
                  </span>
                </div>

                {room.group && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Users className="h-4 w-4" />
                    <span>
                      Grupa:{" "}
                      <span className="font-medium">{room.group.name}</span>
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Wyposażenie:
                  </p>
                  {renderEquipment(room.description)}
                </div>

                <div className="flex gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  <Button variant="outline" size="sm" className="flex-1" disabled>
                    <Calendar className="mr-2 h-4 w-4" />
                    Kalendarz
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditModal(room)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edytuj
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(room)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Usuń
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {editingRoom ? "Edytuj salę" : "Dodaj salę"}
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Określ podstawowe parametry pomieszczenia i jego wyposażenie.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="Zamknij formularz"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Nazwa sali
                  </label>
                  <Input
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    placeholder="np. Sala gimnastyczna"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Pojemność
                  </label>
                  <Input
                    name="capacity"
                    value={formValues.capacity}
                    onChange={handleInputChange}
                    placeholder="np. 25"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Status
                </label>
                <Select
                  value={formValues.status}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({
                      ...prev,
                      status: value as RoomStatus,
                    }))
                  }
                >
                  <SelectTrigger className="w-full justify-between">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_META).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Wyposażenie (oddzielone przecinkami)
                </label>
                <Textarea
                  name="equipment"
                  value={formValues.equipment}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="np. Komputer, Projektor, Mata gimnastyczna"
                />
              </div>

              {formError && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={formLoading} className="bg-sky-500 hover:bg-sky-600 text-white">
                  {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRoom ? "Zapisz zmiany" : "Dodaj salę"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

