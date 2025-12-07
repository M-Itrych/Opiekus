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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
          <span className="ml-3 text-zinc-600">Ładowanie danych...</span>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout
      title="Panel główny"
      description="Przegląd najważniejszych informacji o grupie"
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{children.length}</p>
              <p className="text-xs text-zinc-500">Dzieci w grupie</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-zinc-500">Obecnych</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              <p className="text-xs text-zinc-500">Nieobecnych</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{pendingAttendance}</p>
              <p className="text-xs text-zinc-500">Do sprawdzenia</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Obecności
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/Teacher/Attendance">
                Zarządzaj
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-center dark:bg-green-900/20">
              <p className="text-xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-green-700 dark:text-green-400">Obecnych</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center dark:bg-red-900/20">
              <p className="text-xl font-bold text-red-600">{absentCount}</p>
              <p className="text-xs text-red-700 dark:text-red-400">Nieobecnych</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center dark:bg-amber-900/20">
              <p className="text-xl font-bold text-amber-600">{pendingAttendance}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Oczekuje</p>
            </div>
          </div>

          {pendingAttendance > 0 && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                {pendingAttendance} dzieci czeka na sprawdzenie obecności
              </p>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Moja grupa
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/Teacher/Group">
                Zobacz wszystkie
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            <p>Liczba dzieci w grupie: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{children.length}</span></p>
          </div>

          {children.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {children.slice(0, 6).map((child) => (
                <div
                  key={child.id}
                  className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold dark:bg-indigo-900/30">
                    {child.name[0]}
                  </div>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{child.name}</span>
                </div>
              ))}
              {children.length > 6 && (
                <div className="flex items-center rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
                  <span className="text-sm text-zinc-500">+{children.length - 6} więcej</span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                <Activity className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Aktywności dzienne
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/Teacher/Activities">
                Zarządzaj
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            <p>Rejestruj posiłki, drzemki i aktywności dla dzieci obecnych w grupie.</p>
          </div>

          <div className="flex gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Śniadanie 8:00
            </span>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Obiad 11:30
            </span>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              Drzemka 12:30
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900/30">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Kontrola odbioru
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/Teacher/Pickup">
                Przejdź do kontroli
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-center dark:bg-teal-900/20">
              <p className="text-xl font-bold text-teal-600">{awaitingPickup > 0 ? awaitingPickup : 0}</p>
              <p className="text-xs text-teal-700 dark:text-teal-400">Oczekuje na odbiór</p>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-center dark:bg-green-900/20">
              <p className="text-xl font-bold text-green-600">{pickedUpCount}</p>
              <p className="text-xs text-green-700 dark:text-green-400">Odebranych</p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-gradient-to-r from-sky-500 to-indigo-600 p-6 shadow-sm">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <Calendar className="h-8 w-8" />
            <div>
              <p className="text-lg font-semibold">
                {new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-sm opacity-80">
                Dzień pracy w przedszkolu
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
      </section>
    </TeacherLayout>
  );
}
