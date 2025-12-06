"use client";

import GroupChildren from "@/app/components/teacher/PanelGlowny/GroupChildren";
import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";

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
    pickupAuthorized: ["Anna Kowalska", "Piotr Kowalski", "Maria Nowak"],
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
    pickupAuthorized: ["Katarzyna Nowak", "Tomasz Nowak"],
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
    pickupAuthorized: ["Ewa Wiśniewska"],
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
    pickupAuthorized: ["Agnieszka Wójcik", "Robert Wójcik", "Janina Kowalczyk"],
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
    pickupAuthorized: ["Magdalena Kowalczyk"],
  },
];

export default function Group() {
  return (
    <TeacherLayout
      title="Moja grupa"
      description="Lista dzieci w grupie z informacjami o zgodach i upoważnieniach"
    >
      <GroupChildren children={mockChildren} groupName="Grupa Starszaków" />
    </TeacherLayout>
  );
}

