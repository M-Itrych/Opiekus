"use client";

import { useState, useEffect, useCallback } from "react";
import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ChevronRight, Users, CheckCircle, Clock,
  Activity, Loader2, AlertTriangle, Calendar
} from "lucide-react";

interface Child {
  id: string;
  name: string;
  surname: string;
}

interface AttendanceRecord {
  id: string;
  childId: string;
  status: "PRESENT" | "ABSENT" | "PENDING";
}

interface PickupRecord {
  id: string;
  childId: string;
}

export default function Teacher() {
  const [children, setChildren] = useState<Child[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [pickups, setPickups] = useState<PickupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const childrenRes = await fetch("/api/groups/children");
      if (childrenRes.ok) {
        const childrenData = await childrenRes.json();
        setChildren(childrenData);
      }

      const attendanceRes = await fetch(`/api/attendances?startDate=${today}&endDate=${today}`);
      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendances(attendanceData);
      }

      const pickupRes = await fetch(`/api/pickup?date=${today}`);
      if (pickupRes.ok) {
        const pickupData = await pickupRes.json();
        setPickups(pickupData);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const presentCount = attendances.filter(a => a.status === "PRESENT").length;
  const absentCount = attendances.filter(a => a.status === "ABSENT").length;
  const pendingAttendance = children.length - presentCount - absentCount;
  const pickedUpCount = pickups.length;
  const awaitingPickup = presentCount - pickedUpCount;

  if (loading) {
    return (
      <TeacherLayout
        title="Panel główny"
        description="Przegląd najważniejszych informacji o grupie"
      >
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-sky-600" />
          <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-zinc-600">Ładowanie danych...</span>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout
      title="Panel główny"
      description="Przegląd najważniejszych informacji o grupie"
    >
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:grid-cols-4">
        <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30 shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{children.length}</p>
              <p className="text-xs text-zinc-500 truncate">Dzieci w grupie</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-zinc-500 truncate">Obecnych</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-red-600">{absentCount}</p>
              <p className="text-xs text-zinc-500 truncate">Nieobecnych</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-amber-600">{pendingAttendance}</p>
              <p className="text-xs text-zinc-500 truncate">Do sprawdzenia</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30 shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Obecności
              </h2>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Link href="/Teacher/Attendance">
                Zarządzaj
                <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg sm:rounded-xl bg-green-50 p-2 sm:p-3 text-center dark:bg-green-900/20">
              <p className="text-lg sm:text-xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-green-700 dark:text-green-400">Obecnych</p>
            </div>
            <div className="rounded-lg sm:rounded-xl bg-red-50 p-2 sm:p-3 text-center dark:bg-red-900/20">
              <p className="text-lg sm:text-xl font-bold text-red-600">{absentCount}</p>
              <p className="text-xs text-red-700 dark:text-red-400">Nieobecnych</p>
            </div>
            <div className="rounded-lg sm:rounded-xl bg-amber-50 p-2 sm:p-3 text-center dark:bg-amber-900/20">
              <p className="text-lg sm:text-xl font-bold text-amber-600">{pendingAttendance}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Oczekuje</p>
            </div>
          </div>

          {pendingAttendance > 0 && (
            <div className="rounded-lg bg-amber-50 px-3 sm:px-4 py-2 sm:py-3 dark:bg-amber-900/20">
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {pendingAttendance} dzieci czeka na sprawdzenie obecności
              </p>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Moja grupa
              </h2>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Link href="/Teacher/Group">
                <span className="hidden sm:inline">Zobacz wszystkie</span>
                <span className="sm:hidden">Wszystkie</span>
                <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>

          <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            <p>Liczba dzieci w grupie: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{children.length}</span></p>
          </div>

          {children.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {children.slice(0, 6).map((child) => (
                <div
                  key={child.id}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-zinc-100 px-2 sm:px-3 py-1 dark:bg-zinc-800"
                >
                  <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold dark:bg-indigo-900/30 shrink-0">
                    {child.name[0]}
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 truncate">{child.name}</span>
                </div>
              ))}
              {children.length > 6 && (
                <div className="flex items-center rounded-full bg-zinc-100 px-2 sm:px-3 py-1 dark:bg-zinc-800">
                  <span className="text-xs sm:text-sm text-zinc-500">+{children.length - 6} więcej</span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 shrink-0">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Aktywności dzienne
              </h2>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Link href="/Teacher/Activities">
                Zarządzaj
                <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>

          <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            <p>Rejestruj posiłki, drzemki i aktywności dla dzieci obecnych w grupie.</p>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span className="rounded-full bg-amber-100 px-2 sm:px-3 py-1 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Śniadanie 8:00
            </span>
            <span className="rounded-full bg-orange-100 px-2 sm:px-3 py-1 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Obiad 11:30
            </span>
            <span className="rounded-full bg-purple-100 px-2 sm:px-3 py-1 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              Drzemka 12:30
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900/30 shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Kontrola odbioru
              </h2>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Link href="/Teacher/Pickup">
                <span className="hidden sm:inline">Przejdź do kontroli</span>
                <span className="sm:hidden">Kontrola</span>
                <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-lg sm:rounded-xl bg-teal-50 p-2 sm:p-3 text-center dark:bg-teal-900/20">
              <p className="text-lg sm:text-xl font-bold text-teal-600">{awaitingPickup > 0 ? awaitingPickup : 0}</p>
              <p className="text-xs text-teal-700 dark:text-teal-400">Oczekuje na odbiór</p>
            </div>
            <div className="rounded-lg sm:rounded-xl bg-green-50 p-2 sm:p-3 text-center dark:bg-green-900/20">
              <p className="text-lg sm:text-xl font-bold text-green-600">{pickedUpCount}</p>
              <p className="text-xs text-green-700 dark:text-green-400">Odebranych</p>
            </div>
          </div>
        </section>
      </div>


    </TeacherLayout>
  );
}
