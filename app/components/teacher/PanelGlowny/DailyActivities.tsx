"use client";

import { useState, useEffect, useCallback } from "react";
import { Utensils, Moon, Activity, Loader2, Plus, X, Calendar, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

interface Child {
  id: string;
  name: string;
  surname: string;
}

interface ChildActivity {
  childId: string;
  childName: string;
  breakfast: boolean;
  secondBreakfast: boolean;
  lunch: boolean;
  snack: boolean;
  napStart: string;
  napEnd: string;
  activities: string[];
}

const mealTimes = [
  { name: "Śniadanie", time: "8:00-9:00", key: "breakfast" as const },
  { name: "II śniadanie", time: "10:00-10:15", key: "secondBreakfast" as const },
  { name: "Obiad", time: "11:30-12:30", key: "lunch" as const },
  { name: "Podwieczorek", time: "15:00-15:30", key: "snack" as const },
];

const predefinedActivities = [
  "Zajęcia plastyczne",
  "Zajęcia muzyczne",
  "Zajęcia ruchowe",
  "Czytanie bajek",
  "Zabawa na placu zabaw",
  "Zajęcia edukacyjne",
  "Zabawa konstrukcyjna",
  "Taniec",
  "Gry i zabawy",
];

export default function DailyActivities() {
  const [children, setChildren] = useState<Child[]>([]);
  const [activities, setActivities] = useState<Record<string, ChildActivity>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string | "all">("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [newActivity, setNewActivity] = useState("");
  const [editingChildId, setEditingChildId] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    try {
      const res = await fetch("/api/groups/children");
      if (!res.ok) throw new Error("Failed to fetch children");
      const data = await res.json();
      setChildren(data);

      const initialActivities: Record<string, ChildActivity> = {};
      data.forEach((child: Child) => {
        initialActivities[child.id] = {
          childId: child.id,
          childName: `${child.name} ${child.surname}`,
          breakfast: false,
          secondBreakfast: false,
          lunch: false,
          snack: false,
          napStart: "",
          napEnd: "",
          activities: [],
        };
      });
      setActivities(initialActivities);
    } catch (err) {
      console.error("Error fetching children:", err);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/activities?date=${selectedDate}`);
      if (!res.ok) return;
      
      const data = await res.json();
      if (data && data.length > 0) {
        setActivities(prev => {
          const updated = { ...prev };
          data.forEach((activity: { childId: string; activities: string[]; title: string }) => {
            if (updated[activity.childId]) {
              updated[activity.childId].activities = activity.activities || [];
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  }, [selectedDate]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchChildren();
      await fetchActivities();
      setLoading(false);
    };
    loadData();
  }, [fetchChildren, fetchActivities]);

  const handleMealToggle = (childId: string, mealKey: keyof Pick<ChildActivity, "breakfast" | "secondBreakfast" | "lunch" | "snack">) => {
    setActivities(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        [mealKey]: !prev[childId][mealKey],
      },
    }));
  };

  const handleNapChange = (childId: string, field: "napStart" | "napEnd", value: string) => {
    setActivities(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        [field]: value,
      },
    }));
  };

  const handleAddActivity = (childId: string, activity: string) => {
    if (!activity.trim()) return;
    setActivities(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        activities: [...prev[childId].activities, activity.trim()],
      },
    }));
    setNewActivity("");
  };

  const handleRemoveActivity = (childId: string, activityIndex: number) => {
    setActivities(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        activities: prev[childId].activities.filter((_, idx) => idx !== activityIndex),
      },
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const childrenToSave = selectedChild === "all" 
        ? Object.values(activities) 
        : [activities[selectedChild]];

      for (const childActivity of childrenToSave) {
        if (childActivity.activities.length > 0) {
          await fetch("/api/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              childId: childActivity.childId,
              date: selectedDate,
              title: `Aktywności dnia ${selectedDate}`,
              activities: childActivity.activities,
            }),
          });
        }
      }
      alert("Zapisano aktywności!");
    } catch (err) {
      console.error("Error saving activities:", err);
      alert("Wystąpił błąd podczas zapisywania");
    } finally {
      setSaving(false);
    }
  };

  const filteredActivities = selectedChild === "all"
    ? Object.values(activities)
    : activities[selectedChild] ? [activities[selectedChild]] : [];

  const mealStats = {
    breakfast: filteredActivities.filter(a => a.breakfast).length,
    secondBreakfast: filteredActivities.filter(a => a.secondBreakfast).length,
    lunch: filteredActivities.filter(a => a.lunch).length,
    snack: filteredActivities.filter(a => a.snack).length,
  };

  const napStats = {
    total: filteredActivities.filter(a => a.napStart && a.napEnd).length,
    averageDuration: (() => {
      const naps = filteredActivities.filter(a => a.napStart && a.napEnd);
      if (naps.length === 0) return 0;
      const totalMinutes = naps.reduce((sum, a) => {
        const start = a.napStart.split(":").map(Number);
        const end = a.napEnd.split(":").map(Number);
        const startMin = start[0] * 60 + start[1];
        const endMin = end[0] * 60 + end[1];
        return sum + (endMin - startMin);
      }, 0);
      return Math.round(totalMinutes / naps.length);
    })(),
  };

  if (loading) {
    return (
      <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          <span className="ml-2 text-zinc-600">Ładowanie danych...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Aktywności dzienne
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ewidencja posiłków, snu i aktywności
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-zinc-700 dark:text-zinc-300 outline-none"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <span>
                  {selectedChild === "all"
                    ? "Wszystkie dzieci"
                    : activities[selectedChild]?.childName}
                </span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <DropdownMenuItem
                onSelect={() => setSelectedChild("all")}
                className="flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 text-sm"
              >
                <span>Wszystkie dzieci</span>
                {selectedChild === "all" && <Check className="h-3.5 w-3.5 text-sky-500" />}
              </DropdownMenuItem>
              {children.map((child) => (
                <DropdownMenuItem
                  key={child.id}
                  onSelect={() => setSelectedChild(child.id)}
                  className="flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  <span>{child.name} {child.surname}</span>
                  {selectedChild === child.id && <Check className="h-3.5 w-3.5 text-sky-500" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleSaveAll} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Zapisz
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-sky-600" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Posiłki - Podsumowanie
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {mealTimes.map((meal) => {
              const count = mealStats[meal.key];
              const total = filteredActivities.length;
              return (
                <div key={meal.key} className="flex flex-col gap-1 rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {meal.name}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {count}/{total}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{meal.time}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Sen</h3>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Dzieci śpiące</span>
                <span className="text-2xl font-bold text-indigo-600">{napStats.total}</span>
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Średni czas snu</span>
                <span className="text-2xl font-bold text-indigo-600">{napStats.averageDuration} min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Rejestracja dla każdego dziecka
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredActivities.map((childActivity) => (
            <div
              key={childActivity.childId}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-semibold dark:bg-sky-900/30">
                    {childActivity.childName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {childActivity.childName}
                  </h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingChildId(
                    editingChildId === childActivity.childId ? null : childActivity.childId
                  )}
                >
                  {editingChildId === childActivity.childId ? "Zamknij" : "Edytuj"}
                </Button>
              </div>

              {editingChildId === childActivity.childId && (
                <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                  <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Posiłki</p>
                    <div className="grid grid-cols-2 gap-2">
                      {mealTimes.map((meal) => (
                        <label
                          key={meal.key}
                          className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 cursor-pointer hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          <Checkbox
                            checked={activities[childActivity.childId]?.[meal.key] || false}
                            onCheckedChange={() => handleMealToggle(childActivity.childId, meal.key)}
                          />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">{meal.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Drzemka</p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500">Od</label>
                        <Input
                          type="time"
                          value={activities[childActivity.childId]?.napStart || ""}
                          onChange={(e) => handleNapChange(childActivity.childId, "napStart", e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500">Do</label>
                        <Input
                          type="time"
                          value={activities[childActivity.childId]?.napEnd || ""}
                          onChange={(e) => handleNapChange(childActivity.childId, "napEnd", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Aktywności</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {predefinedActivities.map((activity) => (
                        <button
                          key={activity}
                          onClick={() => handleAddActivity(childActivity.childId, activity)}
                          className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 hover:bg-sky-100 hover:text-sky-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-sky-900/30"
                        >
                          + {activity}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Dodaj własną aktywność..."
                        value={newActivity}
                        onChange={(e) => setNewActivity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddActivity(childActivity.childId, newActivity);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddActivity(childActivity.childId, newActivity)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3">
                {childActivity.activities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {childActivity.activities.map((act, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      >
                        {act}
                        {editingChildId === childActivity.childId && (
                          <button
                            onClick={() => handleRemoveActivity(childActivity.childId, idx)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">Brak zarejestrowanych aktywności</p>
                )}
              </div>

              <div className="mt-2 flex gap-1">
                {activities[childActivity.childId]?.breakfast && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Śniad.</span>
                )}
                {activities[childActivity.childId]?.secondBreakfast && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">II śniad.</span>
                )}
                {activities[childActivity.childId]?.lunch && (
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">Obiad</span>
                )}
                {activities[childActivity.childId]?.snack && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Podw.</span>
                )}
                {activities[childActivity.childId]?.napStart && activities[childActivity.childId]?.napEnd && (
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                    Sen {activities[childActivity.childId].napStart}-{activities[childActivity.childId].napEnd}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredActivities.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            Brak dzieci w grupie
          </p>
        </div>
      )}
    </section>
  );
}
