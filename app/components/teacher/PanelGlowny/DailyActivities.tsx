"use client";

import { useState } from "react";
import { Clock, Utensils, Moon, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

interface ActivityRecord {
  childId: string;
  childName: string;
  breakfast?: boolean;
  secondBreakfast?: boolean;
  lunch?: boolean;
  snack?: boolean;
  napStart?: string;
  napEnd?: string;
  napDuration?: number;
  activities?: string[];
}

interface DailyActivitiesProps {
  activities: ActivityRecord[];
  date: Date;
}

const mealTimes = [
  { name: "Śniadanie", time: "8:00-9:00", key: "breakfast" as const },
  { name: "II śniadanie", time: "10:00-10:15", key: "secondBreakfast" as const },
  { name: "Obiad", time: "11:30-12:30", key: "lunch" as const },
  { name: "Podwieczorek", time: "15:00-15:30", key: "snack" as const },
];

export default function DailyActivities({
  activities,
  date,
}: DailyActivitiesProps) {
  const [selectedChild, setSelectedChild] = useState<string | "all">("all");

  const filteredActivities =
    selectedChild === "all"
      ? activities
      : activities.filter((a) => a.childId === selectedChild);

  const mealStats = {
    breakfast: filteredActivities.filter((a) => a.breakfast).length,
    secondBreakfast: filteredActivities.filter((a) => a.secondBreakfast).length,
    lunch: filteredActivities.filter((a) => a.lunch).length,
    snack: filteredActivities.filter((a) => a.snack).length,
  };

  const napStats = {
    total: filteredActivities.filter((a) => a.napStart).length,
    averageDuration: Math.round(
      filteredActivities
        .filter((a) => a.napDuration)
        .reduce((sum, a) => sum + (a.napDuration || 0), 0) /
        filteredActivities.filter((a) => a.napDuration).length || 0
    ),
  };

  return (
    <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Aktywności dzienne
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-between gap-2 px-4 cursor-pointer"
              >
                <span>
                  {selectedChild === "all"
                    ? "Wszystkie dzieci"
                    : activities.find((a) => a.childId === selectedChild)?.childName}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            >
              <DropdownMenuItem
                onSelect={() => setSelectedChild("all")}
                className="flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-zinc-200 dark:hover:bg-sky-900/30 dark:hover:text-sky-200"
              >
                <span>Wszystkie dzieci</span>
                {selectedChild === "all" && (
                  <Check className="h-3.5 w-3.5 text-sky-500" />
                )}
              </DropdownMenuItem>
              {activities.map((activity) => (
                <DropdownMenuItem
                  key={activity.childId}
                  onSelect={() => setSelectedChild(activity.childId)}
                  className="flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-zinc-200 dark:hover:bg-sky-900/30 dark:hover:text-sky-200"
                >
                  <span>{activity.childName}</span>
                  {selectedChild === activity.childId && (
                    <Check className="h-3.5 w-3.5 text-sky-500" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ewidencja posiłków, snu i aktywności na {date.toLocaleDateString("pl-PL")}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-sky-600" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Posiłki
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {mealTimes.map((meal) => {
              const count = mealStats[meal.key];
              const total = filteredActivities.length;
              return (
                <div
                  key={meal.key}
                  className="flex flex-col gap-1 rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {meal.name}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {count}/{total}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {meal.time}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-sky-600" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Sen
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Dzieci śpiące
                </span>
                <span className="text-2xl font-bold text-sky-600">
                  {napStats.total}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Średni czas snu
                </span>
                <span className="text-2xl font-bold text-sky-600">
                  {napStats.averageDuration} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Aktywności
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map((activity) => (
            <div
              key={activity.childId}
              className="rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-900"
            >
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {activity.childName}
              </p>
              {activity.activities && activity.activities.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {activity.activities.map((act, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-zinc-600 dark:text-zinc-400"
                    >
                      • {act}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Brak zarejestrowanych aktywności
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

