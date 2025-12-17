"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Clock, Loader2, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/app/components/global/Modal/ModalContext";

interface Child {
  id: string;
  name: string;
  surname: string;
  groupId: string | null;
}

interface AttendanceRecord {
  id: string;
  childId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "PENDING";
  reason?: string | null;
  child: Child;
}

interface AttendanceTrackerProps {
  date?: Date;
}

export default function AttendanceTracker({ date = new Date() }: AttendanceTrackerProps) {
  const { showModal } = useModal();
  const [children, setChildren] = useState<Child[]>([]);
  const [attendances, setAttendances] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(date.toISOString().split("T")[0]);

  const fetchChildren = useCallback(async () => {
    try {
      const res = await fetch("/api/groups/children");
      if (!res.ok) throw new Error("Failed to fetch children");
      const data = await res.json();
      setChildren(data);
    } catch (err) {
      console.error("Error fetching children:", err);
    }
  }, []);

  const fetchAttendances = useCallback(async () => {
    try {
      const res = await fetch(`/api/attendances?startDate=${selectedDate}&endDate=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch attendances");
      const data: AttendanceRecord[] = await res.json();

      const records: Record<string, AttendanceRecord> = {};
      data.forEach((record) => {
        records[record.childId] = record;
      });
      setAttendances(records);
    } catch (err) {
      console.error("Error fetching attendances:", err);
    }
  }, [selectedDate]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchChildren(), fetchAttendances()]);
      setLoading(false);
    };
    loadData();
  }, [fetchChildren, fetchAttendances]);

  const handleAttendance = async (childId: string, status: "PRESENT" | "ABSENT") => {
    setSaving(childId);
    try {
      const res = await fetch("/api/attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          date: selectedDate,
          status,
        }),
      });

      if (!res.ok) throw new Error("Failed to save attendance");

      const savedRecord: AttendanceRecord = await res.json();
      setAttendances((prev) => ({
        ...prev,
        [childId]: savedRecord,
      }));
    } catch (err) {
      console.error("Error saving attendance:", err);
      showModal('error', 'Wystąpił błąd podczas zapisywania obecności');
    } finally {
      setSaving(null);
    }
  };

  const filteredChildren = children.filter(
    (child) =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.surname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = Object.values(attendances).filter((a) => a.status === "PRESENT").length;
  const absentCount = Object.values(attendances).filter((a) => a.status === "ABSENT").length;
  const pendingCount = children.length - presentCount - absentCount;

  if (loading) {
    return (
      <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          <span className="ml-2 text-zinc-600">Ładowanie danych obecności...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Lista obecności
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Oznacz obecność dzieci w grupie
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-zinc-700 dark:text-zinc-300 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Obecni</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-600">{presentCount}</p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <X className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">Nieobecni</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">{absentCount}</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Oczekujące</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{pendingCount}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder="Szukaj dziecka..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-col gap-3">
        {filteredChildren.map((child) => {
          const attendance = attendances[child.id];
          const status = attendance?.status;
          const isSaving = saving === child.id;

          return (
            <div
              key={child.id}
              className={`flex items-center justify-between rounded-xl border p-4 transition-all ${status === "PRESENT"
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                  : status === "ABSENT"
                    ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                    : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-semibold dark:bg-sky-900/30">
                  {child.name[0]}{child.surname[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {child.name} {child.surname}
                  </h3>
                  {status && (
                    <p className={`text-xs ${status === "PRESENT"
                        ? "text-green-600"
                        : status === "ABSENT"
                          ? "text-red-600"
                          : "text-amber-600"
                      }`}>
                      {status === "PRESENT" ? "Obecny/a" : status === "ABSENT" ? "Nieobecny/a" : "Oczekuje"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                ) : (
                  <>
                    <Button
                      variant={status === "PRESENT" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAttendance(child.id, "PRESENT")}
                      className={status === "PRESENT" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Obecny
                    </Button>
                    <Button
                      variant={status === "ABSENT" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAttendance(child.id, "ABSENT")}
                      className={status === "ABSENT" ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Nieobecny
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredChildren.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            {children.length === 0
              ? "Brak dzieci w grupie"
              : "Nie znaleziono dzieci pasujących do wyszukiwania."}
          </p>
        </div>
      )}
    </section>
  );
}

