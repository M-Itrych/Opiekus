"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  BookOpen, Clock, CheckCircle, Play, Loader2, 
  ChevronLeft, Award, AlertCircle, Filter, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrainingProgress {
  id: string;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
}

interface Training {
  id: string;
  title: string;
  description: string | null;
  content: string;
  category: string;
  status: string;
  duration: number;
  isRequired: boolean;
  createdAt: string;
  userProgress: TrainingProgress | null;
}

type ViewMode = "list" | "detail";

const categoryLabels: Record<string, string> = {
  BHP: "BHP",
  PIERWSZA_POMOC: "Pierwsza pomoc",
  PEDAGOGIKA: "Pedagogika",
  PSYCHOLOGIA: "Psychologia",
  ROZWOJ_ZAWODOWY: "Rozwój zawodowy",
  PRAWO: "Prawo oświatowe",
  INNE: "Inne",
};

const categoryColors: Record<string, string> = {
  BHP: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PIERWSZA_POMOC: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  PEDAGOGIKA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PSYCHOLOGIA: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ROZWOJ_ZAWODOWY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PRAWO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  INNE: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function TrainingList() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTrainings = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/api/trainings?includeProgress=true";
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch trainings");
      const data = await res.json();
      setTrainings(data);
    } catch (err) {
      console.error("Error fetching trainings:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const handleStartTraining = async (trainingId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trainings/${trainingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (!res.ok) throw new Error("Failed to start training");

      // Refresh training data
      const trainingRes = await fetch(`/api/trainings/${trainingId}?includeProgress=true`);
      if (trainingRes.ok) {
        const updatedTraining = await trainingRes.json();
        setSelectedTraining(updatedTraining);
        setTrainings(prev => 
          prev.map(t => t.id === trainingId ? updatedTraining : t)
        );
      }
    } catch (err) {
      console.error("Error starting training:", err);
      alert("Wystąpił błąd podczas rozpoczynania szkolenia");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTraining = async (trainingId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trainings/${trainingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", score: 100 }),
      });

      if (!res.ok) throw new Error("Failed to complete training");

      // Refresh training data
      const trainingRes = await fetch(`/api/trainings/${trainingId}?includeProgress=true`);
      if (trainingRes.ok) {
        const updatedTraining = await trainingRes.json();
        setSelectedTraining(updatedTraining);
        setTrainings(prev => 
          prev.map(t => t.id === trainingId ? updatedTraining : t)
        );
      }

      alert("Gratulacje! Szkolenie zostało ukończone.");
    } catch (err) {
      console.error("Error completing training:", err);
      alert("Wystąpił błąd podczas kończenia szkolenia");
    } finally {
      setActionLoading(false);
    }
  };

  const getProgressStatus = (training: Training) => {
    if (!training.userProgress) return "not_started";
    if (training.userProgress.completedAt) return "completed";
    return "in_progress";
  };

  const completedCount = trainings.filter(t => getProgressStatus(t) === "completed").length;
  const inProgressCount = trainings.filter(t => getProgressStatus(t) === "in_progress").length;
  const requiredNotCompleted = trainings.filter(
    t => t.isRequired && getProgressStatus(t) !== "completed"
  ).length;

  if (loading) {
    return (
      <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          <span className="ml-2 text-zinc-600">Ładowanie szkoleń...</span>
        </div>
      </section>
    );
  }

  // Training Detail View
  if (viewMode === "detail" && selectedTraining) {
    const status = getProgressStatus(selectedTraining);

    return (
      <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => {
            setSelectedTraining(null);
            setViewMode("list");
          }}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Powrót
          </Button>
        </div>

        <div className="border-b border-zinc-200 pb-4 dark:border-zinc-700">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${categoryColors[selectedTraining.category] || categoryColors.INNE}`}>
                  {categoryLabels[selectedTraining.category] || selectedTraining.category}
                </span>
                {selectedTraining.isRequired && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Wymagane
                  </span>
                )}
                {status === "completed" && (
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    Ukończone
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedTraining.title}
              </h2>
              {selectedTraining.description && (
                <p className="text-sm text-zinc-500 mt-1">{selectedTraining.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Clock className="h-4 w-4" />
              <span>{selectedTraining.duration} min</span>
            </div>
          </div>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <div 
            className="text-zinc-700 dark:text-zinc-300"
            dangerouslySetInnerHTML={{ __html: selectedTraining.content.replace(/\n/g, '<br/>') }}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          {status === "not_started" && (
            <Button onClick={() => handleStartTraining(selectedTraining.id)} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Rozpoczynanie...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Rozpocznij szkolenie
                </>
              )}
            </Button>
          )}
          {status === "in_progress" && (
            <Button onClick={() => handleCompleteTraining(selectedTraining.id)} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Kończenie...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Oznacz jako ukończone
                </>
              )}
            </Button>
          )}
          {status === "completed" && (
            <div className="flex items-center gap-2 text-green-600">
              <Award className="h-5 w-5" />
              <span className="font-medium">Szkolenie ukończone!</span>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Training List View
  return (
    <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Szkolenia
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Moduły edukacyjne i szkolenia dla nauczycieli
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Ukończone</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-600">{completedCount}</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">W trakcie</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{inProgressCount}</p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">Wymagane</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">{requiredNotCompleted}</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-400" />
        <button
          onClick={() => setSelectedCategory(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !selectedCategory
              ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          Wszystkie
        </button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategory === key
                ? categoryColors[key]
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Training List */}
      <div className="flex flex-col gap-3">
        {trainings.length > 0 ? (
          trainings.map((training) => {
            const status = getProgressStatus(training);

            return (
              <button
                key={training.id}
                onClick={() => {
                  setSelectedTraining(training);
                  setViewMode("detail");
                }}
                className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                  status === "completed"
                    ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10"
                    : status === "in_progress"
                    ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10"
                    : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  status === "completed"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                    : status === "in_progress"
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                    : "bg-sky-100 text-sky-600 dark:bg-sky-900/30"
                }`}>
                  {status === "completed" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : status === "in_progress" ? (
                    <Play className="h-6 w-6" />
                  ) : (
                    <BookOpen className="h-6 w-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[training.category] || categoryColors.INNE}`}>
                      {categoryLabels[training.category] || training.category}
                    </span>
                    {training.isRequired && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Wymagane
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {training.title}
                  </h3>
                  {training.description && (
                    <p className="text-sm text-zinc-500 truncate mt-1">
                      {training.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {training.duration} min
                    </span>
                    {status === "completed" && training.userProgress?.completedAt && (
                      <span className="text-green-600">
                        Ukończono {new Date(training.userProgress.completedAt).toLocaleDateString("pl-PL")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {status === "completed" ? (
                    <Award className="h-5 w-5 text-green-500" />
                  ) : (
                    <Play className={`h-5 w-5 ${status === "in_progress" ? "text-amber-500" : "text-zinc-300"}`} />
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">
              {selectedCategory
                ? "Brak szkoleń w wybranej kategorii"
                : "Brak dostępnych szkoleń"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

