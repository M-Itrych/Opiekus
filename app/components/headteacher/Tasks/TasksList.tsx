"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  CheckCircle,
  Circle,
  Calendar,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, X } from "lucide-react";

type Priority = "LOW" | "MEDIUM" | "HIGH";
type Status = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type Category = "ADMINISTRACYJNE" | "EDUKACYJNE" | "TECHNICZNE" | "INNE";

interface TaskRecord {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  category: Category;
  assignedTo: {
    id: string;
    name: string | null;
    surname: string | null;
  } | null;
}

interface StaffMember {
  id: string;
  user: {
    id: string;
    name: string;
    surname: string;
  };
}

interface TaskFormState {
  title: string;
  description: string;
  dueDate: string;
  assignedToId: string;
  priority: Priority;
  category: Category;
}

const priorityLabels: Record<Priority, string> = {
  HIGH: "Wysoki",
  MEDIUM: "Średni",
  LOW: "Niski",
};

const statusLabels: Record<Status, string> = {
  TODO: "Do zrobienia",
  IN_PROGRESS: "W trakcie",
  COMPLETED: "Zakończone",
  CANCELLED: "Anulowane",
};

const categoryLabels: Record<Category, string> = {
  ADMINISTRACYJNE: "Administracyjne",
  EDUKACYJNE: "Edukacyjne",
  TECHNICZNE: "Techniczne",
  INNE: "Inne",
};

const defaultFormState: TaskFormState = {
  title: "",
  description: "",
  dueDate: "",
  assignedToId: "",
  priority: "MEDIUM",
  category: "ADMINISTRACYJNE",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pl-PL");
}

function isToday(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function TasksList() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<TaskFormState>(defaultFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/tasks", { cache: "no-store" });
      if (!response.ok) throw new Error("Błąd pobierania zadań");
      const data: TaskRecord[] = await response.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać zadań. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      setStaffLoading(true);
      setStaffError(null);
      const response = await fetch("/api/staff", { cache: "no-store" });
      if (!response.ok) throw new Error("Błąd pobierania pracowników");
      const data: StaffMember[] = await response.json();
      setStaff(data);
    } catch (err) {
      console.error(err);
      setStaffError("Nie udało się załadować listy pracowników.");
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchStaff();
  }, [fetchTasks, fetchStaff]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "all" || task.status.toLowerCase() === selectedStatus;
      const matchesPriority =
        selectedPriority === "all" || task.priority.toLowerCase() === selectedPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, selectedStatus, selectedPriority]);

  const todayTasks = useMemo(() => tasks.filter((task) => isToday(task.dueDate)), [tasks]);

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "IN_PROGRESS":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Circle className="h-5 w-5 text-zinc-400" />;
    }
  };

  const getPriorityClass = (priority: Priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-rose-100 text-rose-700";
      case "LOW":
        return "bg-zinc-100 text-zinc-700";
      default:
        return "bg-sky-100 text-sky-700";
    }
  };

  const openModal = () => {
    setFormState(defaultFormState);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.title.trim() || !formState.description.trim()) {
      setFormError("Uzupełnij tytuł i opis zadania.");
      return;
    }
    if (!formState.dueDate) {
      setFormError("Podaj termin wykonania.");
      return;
    }
    if (!formState.assignedToId) {
      setFormError("Wybierz osobę odpowiedzialną.");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          status: "TODO",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Nie udało się dodać zadania");
      }

      setIsModalOpen(false);
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Zadania na dziś</h2>
            <p className="text-sm text-zinc-500">
              Przegląd terminów wymagających uwagi w bieżącym dniu.
            </p>
          </div>
        </div>
        {todayTasks.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 py-10 text-sm text-zinc-500">
            Brak zadań z terminem na dziś.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-sky-50/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
                    {getStatusIcon(task.status)}
                    {task.title}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityClass(task.priority)}`}>
                    {priorityLabels[task.priority]}
                  </span>
                </div>
                <p className="text-sm text-sky-900/80">{task.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-sky-900/70">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {task.assignedTo
                      ? `${task.assignedTo.name ?? ""} ${task.assignedTo.surname ?? ""}`.trim()
                      : "Nieprzypisane"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Termin: {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Zarządzanie zadaniami</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Przydzielanie i śledzenie zadań dla personelu.
            </p>
          </div>
          <Button className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white" onClick={openModal}>
            <Plus className="h-4 w-4" />
            Nowe zadanie
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Szukaj zadań..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                Status: {selectedStatus === "all" ? "Wszystkie" : statusLabels[selectedStatus.toUpperCase() as Status] ?? selectedStatus}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setSelectedStatus("all")}>
                Wszystkie
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedStatus("todo")}>
                Do zrobienia
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedStatus("in_progress")}>
                W trakcie
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedStatus("completed")}>
                Zakończone
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                Priorytet: {selectedPriority === "all" ? "Wszystkie" : priorityLabels[selectedPriority.toUpperCase() as Priority] ?? selectedPriority}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setSelectedPriority("all")}>
                Wszystkie
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedPriority("high")}>
                Wysoki
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedPriority("medium")}>
                Średni
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedPriority("low")}>
                Niski
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-zinc-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Ładowanie zadań...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-500">
            Brak zadań spełniających kryteria wyszukiwania.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="mt-1">{getStatusIcon(task.status)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-zinc-900">{task.title}</h4>
                      <p className="mt-1 text-sm text-zinc-600">{task.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityClass(task.priority)}`}>
                        {priorityLabels[task.priority]}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                        {categoryLabels[task.category]}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-600">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {task.assignedTo
                        ? `${task.assignedTo.name ?? ""} ${task.assignedTo.surname ?? ""}`.trim()
                        : "Nieprzypisane"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Termin: {formatDate(task.dueDate)}
                    </span>
                    <span className="ml-auto text-xs uppercase text-zinc-500">
                      {statusLabels[task.status]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Dodaj nowe zadanie</h3>
                <p className="text-sm text-zinc-500">
                  Uzupełnij szczegóły i przydziel zadanie odpowiedniej osobie.
                </p>
              </div>
              <button
                aria-label="Zamknij"
                onClick={closeModal}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 px-6 py-6">
              <div>
                <label className="text-sm font-medium text-zinc-700">Temat zadania</label>
                <Input
                  name="title"
                  value={formState.title}
                  onChange={handleInputChange}
                  placeholder="Np. Przygotować raport RODO"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">Opis</label>
                <Textarea
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Opisz szczegóły zadania..."
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Termin wykonania</label>
                  <Input
                    type="date"
                    name="dueDate"
                    value={formState.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Priorytet
                  </label>
                  <Select
                    value={formState.priority}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, priority: value as Priority }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">Wysoki</SelectItem>
                      <SelectItem value="MEDIUM">Średni</SelectItem>
                      <SelectItem value="LOW">Niski</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Kategoria</label>
                  <Select
                    value={formState.category}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, category: value as Category }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMINISTRACYJNE">Administracyjne</SelectItem>
                      <SelectItem value="EDUKACYJNE">Edukacyjne</SelectItem>
                      <SelectItem value="TECHNICZNE">Techniczne</SelectItem>
                      <SelectItem value="INNE">Inne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Przypisz pracownika
                  </label>
                  <Select
                    value={formState.assignedToId}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, assignedToId: value }))
                    }
                    disabled={staffLoading || !!staffError}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={staffLoading ? "Ładowanie..." : "Wybierz osobę"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((member) => (
                        <SelectItem key={member.id} value={member.user.id}>
                          {member.user.name} {member.user.surname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {staffError && (
                    <p className="mt-1 text-xs text-red-600">{staffError}</p>
                  )}
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}

              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={submitting} className="bg-sky-500 hover:bg-sky-600 text-white">
                  {submitting ? "Dodawanie..." : "Dodaj zadanie"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

