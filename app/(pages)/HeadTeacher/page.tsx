"use client";

import Topbar from "@/app/components/global/TopBar/topbar";
import NavbarHeadteacher from "@/app/components/global/NavBar/variants/navbar_headteacher";
import AttendanceSummary from "@/app/components/headteacher/PanelGlowny/AttendanceSummary";
import AttendanceChart from "@/app/components/headteacher/PanelGlowny/AttendanceChart";
import DayPlan from "@/app/components/headteacher/PanelGlowny/DayPlan";

type AttendanceKey = "present" | "reported" | "absent";

const attendanceStatuses: Array<{
  key: AttendanceKey;
  label: string;
  color: string;
  accent: string;
}> = [
  {
    key: "present",
    label: "Obecni",
    color: "bg-emerald-500/15 text-emerald-600",
    accent: "bg-emerald-500",
  },
  {
    key: "reported",
    label: "Zgłoszone nieobecności",
    color: "bg-amber-500/15 text-amber-600",
    accent: "bg-amber-500",
  },
  {
    key: "absent",
    label: "Nieobecni",
    color: "bg-rose-500/15 text-rose-600",
    accent: "bg-rose-500",
  },
];

const dniDanych: Array<{
  date: Date;
  grupyData: Array<{
    name: string;
    counts: Record<AttendanceKey, number>;
  }>;
}> = [
  {
    date: new Date(),
    grupyData: [
      {
        name: "Wszyscy uczniowie",
        counts: { present: 24, reported: 6, absent: 2 },
      },
      {
        name: "Grupa 1",
        counts: { present: 12, reported: 2, absent: 1 },
      },
      {
        name: "Grupa 2",
        counts: { present: 12, reported: 4, absent: 1 },
      },
    ],
  },
  {
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d;
    })(),
    grupyData: [
      {
        name: "Wszyscy uczniowie",
        counts: { present: 22, reported: 5, absent: 3 },
      },
      {
        name: "Grupa 1",
        counts: { present: 11, reported: 3, absent: 1 },
      },
      {
        name: "Grupa 2",
        counts: { present: 11, reported: 2, absent: 2 },
      },
    ],
  },
  {
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      return d;
    })(),
    grupyData: [
      {
        name: "Wszyscy uczniowie",
        counts: { present: 26, reported: 4, absent: 1 },
      },
      {
        name: "Grupa 1",
        counts: { present: 13, reported: 1, absent: 1 },
      },
      {
        name: "Grupa 2",
        counts: { present: 13, reported: 3, absent: 0 },
      },
    ],
  },
];

const upcomingEvents = [
    {
      title: "Spotkanie z rodzicami",
      date: "2025-01-01",
      time: "10:00",
      description: "Omówienie wyników śródrocznych i planów na kolejny semestr.",
    },
    {
      title: "Rada pedagogiczna",
      date: "2025-01-01",
      time: "14:00",
      description: "Podsumowanie pierwszego półrocza oraz planowanie szkoleń.",
    },
    {
      title: "Dzień otwarty",
      date: "2025-01-01",
      time: "16:00",
      description: "Prezentacja oferty szkoły dla nowych rodziców i uczniów.",
    },
  ];

export default function HeadTeacher() {
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-zinc-50 dark:bg-black">
      <NavbarHeadteacher />
      <div className="flex min-w-0 pt-[64px] flex-1 flex-col overflow-hidden ml-[80px]">
        <Topbar />
        <main className="flex flex-1 min-w-0 flex-col gap-6 overflow-y-auto px-6 py-6 md:px-8">
          <DayPlan upcomingEvents={upcomingEvents} />
          <AttendanceSummary
            dniDanych={dniDanych}
            attendanceStatuses={attendanceStatuses}
          />
          <AttendanceChart
            dniDanych={dniDanych}
            attendanceStatuses={attendanceStatuses}
          />
        </main>
      </div>
    </div>
  );
}
