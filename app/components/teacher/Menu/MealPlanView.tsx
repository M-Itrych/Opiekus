"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Calendar, Loader2, ChevronLeft, ChevronRight, 
  Utensils, AlertTriangle, Coffee, Sun, Moon 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MealPlan {
  id: string;
  date: string;
  mealType: string;
  name: string;
  description?: string | null;
  allergens: string[];
  group?: {
    id: string;
    name: string;
  } | null;
}

const mealTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  BREAKFAST: { label: "Śniadanie", icon: <Coffee className="h-4 w-4" />, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  SECOND_BREAKFAST: { label: "II Śniadanie", icon: <Sun className="h-4 w-4" />, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  LUNCH: { label: "Obiad", icon: <Utensils className="h-4 w-4" />, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  SNACK: { label: "Podwieczorek", icon: <Moon className="h-4 w-4" />, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

export default function MealPlanView() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
  };

  const fetchMealPlans = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = formatDate(weekDays[0]);
      const endDate = formatDate(weekDays[4]);
      
      const res = await fetch(`/api/meal-plans?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch meal plans");
      const data = await res.json();
      setMealPlans(data);
    } catch (err) {
      console.error("Error fetching meal plans:", err);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(now.setDate(diff)));
  };

  const getMealsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return mealPlans.filter(meal => meal.date.split("T")[0] === dateStr);
  };

  const getMealTypeLabel = (mealType: string) => {
    return mealTypeConfig[mealType]?.label || mealType;
  };

  const getMealTypeConfig = (mealType: string) => {
    return mealTypeConfig[mealType] || { 
      label: mealType, 
      icon: <Utensils className="h-4 w-4" />, 
      color: "bg-zinc-100 text-zinc-700" 
    };
  };

  if (loading) {
    return (
      <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          <span className="ml-2 text-zinc-600">Ładowanie jadłospisu...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Jadłospis tygodniowy
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {weekDays[0].toLocaleDateString("pl-PL", { day: "numeric", month: "long" })} - {weekDays[4].toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
            <Calendar className="h-4 w-4 mr-1" />
            Dzisiaj
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {weekDays.map((day) => {
          const meals = getMealsForDate(day);
          const isToday = formatDate(day) === formatDate(new Date());

          return (
            <div
              key={formatDate(day)}
              className={`rounded-xl border p-4 ${
                isToday
                  ? "border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-900/20"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <div className={`text-sm font-semibold mb-3 ${isToday ? "text-sky-700 dark:text-sky-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                {formatDisplayDate(day)}
                {isToday && <span className="ml-2 text-xs font-normal">(dziś)</span>}
              </div>

              {meals.length > 0 ? (
                <div className="space-y-3">
                  {["BREAKFAST", "SECOND_BREAKFAST", "LUNCH", "SNACK"].map((mealType) => {
                    const meal = meals.find(m => m.mealType === mealType);
                    if (!meal) return null;
                    
                    const config = getMealTypeConfig(mealType);

                    return (
                      <div key={mealType} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                        <div className={`flex items-center gap-2 text-xs font-medium rounded-full px-2 py-1 w-fit ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-2">
                          {meal.name}
                        </p>
                        {meal.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {meal.description}
                          </p>
                        )}
                        {meal.allergens && meal.allergens.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              {meal.allergens.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <Utensils className="h-8 w-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Brak jadłospisu
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <span className="text-xs font-medium text-zinc-500">Legenda:</span>
        {Object.entries(mealTypeConfig).map(([key, config]) => (
          <div key={key} className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${config.color}`}>
            {config.icon}
            {config.label}
          </div>
        ))}
      </div>

      {mealPlans.length === 0 && (
        <div className="py-8 text-center border-t border-zinc-200 dark:border-zinc-700">
          <Utensils className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">
            Brak jadłospisu na wybrany tydzień
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Jadłospis jest tworzony przez dyrektora przedszkola
          </p>
        </div>
      )}
    </section>
  );
}

