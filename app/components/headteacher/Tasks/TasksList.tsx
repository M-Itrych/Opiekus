"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, CheckCircle, Circle, Calendar, User, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "done";
  category: "administracyjne" | "edukacyjne" | "techniczne" | "inne";
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Przygotowanie raportu RODO na kontrolę",
    description: "Wygenerowanie kompleksowego raportu wszystkich zgód rodziców",
    assignedTo: "Katarzyna Wiśniewska",
    dueDate: "2024-02-01",
    priority: "high",
    status: "in_progress",
    category: "administracyjne",
  },
  {
    id: "2",
    title: "Aktualizacja jadłospisu na luty",
    description: "Przygotowanie nowego jadłospisu z uwzględnieniem diet specjalnych",
    assignedTo: "Katarzyna Wiśniewska",
    dueDate: "2024-01-28",
    priority: "medium",
    status: "todo",
    category: "administracyjne",
  },
  {
    id: "3",
    title: "Szkolenie z cyberbezpieczeństwa",
    description: "Przeprowadzenie szkolenia dla nauczycieli",
    assignedTo: "Anna Kowalska",
    dueDate: "2024-02-05",
    priority: "medium",
    status: "todo",
    category: "edukacyjne",
  },
  {
    id: "4",
    title: "Konserwacja sali gimnastycznej",
    description: "Przegląd i naprawa wyposażenia",
    assignedTo: "Jan Kowalczyk",
    dueDate: "2024-01-30",
    priority: "low",
    status: "done",
    category: "techniczne",
  },
];

export default function TasksList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  const filteredTasks = mockTasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || task.status === selectedStatus;
    const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="h-5 w-5 text-sky-600" />;
      case "in_progress":
        return <AlertCircle className="h-5 w-5 text-sky-600" />;
      default:
        return <Circle className="h-5 w-5 text-zinc-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      todo: "Do zrobienia",
      in_progress: "W trakcie",
      done: "Zakończone",
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
      case "medium":
        return "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400";
      case "low":
        return "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400";
      default:
        return "";
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: "Wysoki",
      medium: "Średni",
      low: "Niski",
    };
    return labels[priority] || priority;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      administracyjne: "Administracyjne",
      edukacyjne: "Edukacyjne",
      techniczne: "Techniczne",
      inne: "Inne",
    };
    return labels[category] || category;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Zarządzanie zadaniami
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Przydzielanie i śledzenie zadań dla personelu
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nowe zadanie
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
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
              Status: {selectedStatus === "all" ? "Wszystkie" : getStatusLabel(selectedStatus)}
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
            <DropdownMenuItem onSelect={() => setSelectedStatus("done")}>
              Zakończone
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Priorytet: {selectedPriority === "all" ? "Wszystkie" : getPriorityLabel(selectedPriority)}
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

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mt-1">
              {getStatusIcon(task.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {task.title}
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {task.description}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {getCategoryLabel(task.category)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{task.assignedTo}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Termin: {task.dueDate}</span>
                </div>
                <span className="ml-auto text-xs">
                  {getStatusLabel(task.status)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

