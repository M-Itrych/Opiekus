"use client";

import DailyActivities from "@/app/components/teacher/PanelGlowny/DailyActivities";
import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";

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

export default function Activities() {
  const today = new Date();

  return (
    <TeacherLayout
      title="Aktywności dzienne"
      description="Ewidencja posiłków, snu i aktywności dzieci"
    >
      <DailyActivities activities={mockActivities} date={today} />
    </TeacherLayout>
  );
}

