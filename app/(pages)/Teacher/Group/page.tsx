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

