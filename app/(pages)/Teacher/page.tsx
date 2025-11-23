"use client";

import GroupChildren from "@/app/components/teacher/PanelGlowny/GroupChildren";
import DailyActivities from "@/app/components/teacher/PanelGlowny/DailyActivities";
import PickupControl from "@/app/components/teacher/PanelGlowny/PickupControl";
import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const mockChildren = [
  {
    id: "1",
    name: "Jan",
    surname: "Kowalski",
    age: 4,
    hasImageConsent: true,
    hasDataConsent: true,
    allergies: ["Orzechy"],
    specialNeeds: undefined,
    pickupAuthorized: [
      { name: "Anna Kowalska", id: "p1", relation: "Mama" },
      { name: "Piotr Kowalski", id: "p2", relation: "Tata" },
      { name: "Maria Nowak", id: "p3", relation: "Babcia" },
    ],
  },
  {
    id: "2",
    name: "Zuzanna",
    surname: "Nowak",
    age: 5,
    hasImageConsent: false,
    hasDataConsent: true,
    allergies: [],
    specialNeeds: undefined,
    pickupAuthorized: [
      { name: "Katarzyna Nowak", id: "p4", relation: "Mama" },
      { name: "Tomasz Nowak", id: "p5", relation: "Tata" },
    ],
  },
  {
    id: "3",
    name: "Michał",
    surname: "Wiśniewski",
    age: 3,
    hasImageConsent: true,
    hasDataConsent: true,
    allergies: ["Laktoza"],
    specialNeeds: "Wymaga dodatkowej uwagi podczas zajęć",
    pickupAuthorized: [
      { name: "Ewa Wiśniewska", id: "p6", relation: "Mama" },
    ],
  },
  {
    id: "4",
    name: "Lena",
    surname: "Wójcik",
    age: 4,
    hasImageConsent: true,
    hasDataConsent: true,
    allergies: [],
    specialNeeds: undefined,
    pickupAuthorized: [
      { name: "Agnieszka Wójcik", id: "p7", relation: "Mama" },
      { name: "Robert Wójcik", id: "p8", relation: "Tata" },
      { name: "Janina Kowalczyk", id: "p9", relation: "Babcia" },
    ],
  },
  {
    id: "5",
    name: "Antoni",
    surname: "Kowalczyk",
    age: 5,
    hasImageConsent: true,
    hasDataConsent: false,
    allergies: ["Jajka"],
    specialNeeds: undefined,
    pickupAuthorized: [
      { name: "Magdalena Kowalczyk", id: "p10", relation: "Mama" },
    ],
  },
];

const mockActivities = [
  {
    childId: "1",
    childName: "Jan Kowalski",
    breakfast: true,
    secondBreakfast: true,
    lunch: true,
    snack: false,
    napStart: "12:45",
    napEnd: "14:30",
    napDuration: 105,
    activities: ["Zajęcia plastyczne", "Zabawa na placu zabaw"],
  },
  {
    childId: "2",
    childName: "Zuzanna Nowak",
    breakfast: true,
    secondBreakfast: true,
    lunch: true,
    snack: true,
    napStart: "13:00",
    napEnd: "14:15",
    napDuration: 75,
    activities: ["Czytanie bajek", "Zajęcia muzyczne"],
  },
  {
    childId: "3",
    childName: "Michał Wiśniewski",
    breakfast: true,
    secondBreakfast: false,
    lunch: true,
    snack: true,
    napStart: "12:30",
    napEnd: "15:00",
    napDuration: 150,
    activities: ["Zabawa konstrukcyjna"],
  },
  {
    childId: "4",
    childName: "Lena Wójcik",
    breakfast: true,
    secondBreakfast: true,
    lunch: true,
    snack: true,
    napStart: "13:15",
    napEnd: "14:45",
    napDuration: 90,
    activities: ["Zajęcia plastyczne", "Taniec", "Zabawa na placu zabaw"],
  },
  {
    childId: "5",
    childName: "Antoni Kowalczyk",
    breakfast: true,
    secondBreakfast: true,
    lunch: true,
    snack: false,
    napStart: "12:45",
    napEnd: "14:00",
    napDuration: 75,
    activities: ["Zajęcia sportowe"],
  },
];

export default function Teacher() {
  const today = new Date();

  return (
    <TeacherLayout
      title="Panel główny"
      description="Przegląd najważniejszych informacji o grupie"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Moja grupa - Podgląd
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/Teacher/Group">
                Zobacz wszystkie
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            <p>Liczba dzieci w grupie: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{mockChildren.length}</span></p>
            <p className="mt-2">Obecni dzisiaj: <span className="font-semibold text-sky-600">{mockChildren.length}</span></p>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Aktywności dzienne - Podgląd
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/Teacher/Activities">
                Zobacz wszystkie
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            <p>Zarejestrowane aktywności: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{mockActivities.length}</span></p>
            <p className="mt-2">Dzieci śpiące: <span className="font-semibold text-sky-600">{mockActivities.filter(a => a.napStart).length}</span></p>
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Kontrola odbioru - Podgląd
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/Teacher/Pickup">
              Przejdź do kontroli
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          <p>Dzieci oczekujące na odbiór: <span className="font-semibold text-sky-600">{mockChildren.length}</span></p>
          <p className="mt-2">Odebrane: <span className="font-semibold text-sky-600">0</span></p>
        </div>
      </section>
    </TeacherLayout>
  );
}

