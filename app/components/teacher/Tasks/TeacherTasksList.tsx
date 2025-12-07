"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  CheckCircle,
  Circle,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function TeacherTasksList() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateTaskStatus = async (taskId: string, newStatus: Status) => {
    try {
      setUpdatingTaskId(taskId);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Nie udało się zaktualizować statusu");
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error(err);
      alert("Wystąpił błąd podczas aktualizacji statusu.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

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

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Zadania na dziś</h2>
            <p className="text-sm text-zinc-500">
              Twoje zadania wymagające uwagi w bieżącym dniu.
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
                <div className="flex items-center gap-2 text-xs text-sky-900/70">
                  <Calendar className="h-4 w-4" />
                  Termin: {formatDate(task.dueDate)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Wszystkie zadania</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Przegląd i aktualizacja przypisanych zadań.
            </p>
          </div>
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
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-600">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Termin: {formatDate(task.dueDate)}
                        </span>
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-1" disabled={updatingTaskId === task.id}>
                                {updatingTaskId === task.id ? <Loader2 className="h-3 w-3 animate-spin"/> : null}
                                {statusLabels[task.status]}
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateTaskStatus(task.id, "TODO")}>
                                Do zrobienia
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateTaskStatus(task.id, "IN_PROGRESS")}>
                                W trakcie
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateTaskStatus(task.id, "COMPLETED")}>
                                Zakończone
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

