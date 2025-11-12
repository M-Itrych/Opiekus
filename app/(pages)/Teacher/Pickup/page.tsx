"use client";

import PickupControl from "@/app/components/teacher/PanelGlowny/PickupControl";
import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";

const mockChildren = [
  {
    id: "1",
    name: "Jan",
    surname: "Kowalski",
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
    pickupAuthorized: [
      { name: "Katarzyna Nowak", id: "p4", relation: "Mama" },
      { name: "Tomasz Nowak", id: "p5", relation: "Tata" },
    ],
  },
  {
    id: "3",
    name: "Michał",
    surname: "Wiśniewski",
    pickupAuthorized: [
      { name: "Ewa Wiśniewska", id: "p6", relation: "Mama" },
    ],
  },
  {
    id: "4",
    name: "Lena",
    surname: "Wójcik",
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
    pickupAuthorized: [
      { name: "Magdalena Kowalczyk", id: "p10", relation: "Mama" },
    ],
  },
];

export default function Pickup() {
  return (
    <TeacherLayout
      title="Kontrola odbioru dzieci"
      description="Weryfikacja tożsamości i odbiór dzieci przez upoważnione osoby"
    >
      <PickupControl children={mockChildren} />
    </TeacherLayout>
  );
}

