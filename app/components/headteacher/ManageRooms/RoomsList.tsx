"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Home, Plus, Edit, Calendar, Users } from "lucide-react";

interface Room {
  id: string;
  name: string;
  capacity: number;
  currentGroup?: string;
  equipment: string[];
  maintenanceDate?: string;
  status: "available" | "occupied" | "maintenance";
}

const mockRooms: Room[] = [
  {
    id: "1",
    name: "Sala 1",
    capacity: 25,
    currentGroup: "Grupa Starszaków",
    equipment: ["Komputer", "Projektor", "Kącik czytelniczy"],
    maintenanceDate: "2024-06-15",
    status: "occupied",
  },
  {
    id: "2",
    name: "Sala 2",
    capacity: 25,
    currentGroup: "Grupa Średniaków",
    equipment: ["Tablica interaktywna", "Kącik plastyczny"],
    maintenanceDate: "2024-05-20",
    status: "occupied",
  },
  {
    id: "3",
    name: "Sala 3",
    capacity: 20,
    currentGroup: "Grupa Maluchów",
    equipment: ["Materace", "Kącik zabaw"],
    status: "occupied",
  },
  {
    id: "4",
    name: "Sala gimnastyczna",
    capacity: 30,
    equipment: ["Mata gimnastyczna", "Piłki", "Tunel"],
    status: "available",
  },
];

export default function RoomsList() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRooms = mockRooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.currentGroup?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
      case "occupied":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
      case "maintenance":
        return "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: "Dostępna",
      occupied: "Zajęta",
      maintenance: "Konserwacja",
    };
    return labels[status] || status;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Zarządzanie salami
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Rezerwacja sal, harmonogram wykorzystania, konserwacja i wyposażenie
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Dodaj salę
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder="Szukaj sal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
                  <Home className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {room.name}
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Pojemność: {room.capacity} osób
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                {getStatusLabel(room.status)}
              </span>
            </div>

            {room.currentGroup && (
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Users className="h-4 w-4" />
                <span>Grupa: <span className="font-medium">{room.currentGroup}</span></span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Wyposażenie:
              </p>
              <div className="flex flex-wrap gap-2">
                {room.equipment.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-md text-xs bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {room.maintenanceDate && (
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Calendar className="h-4 w-4" />
                <span>Konserwacja: {room.maintenanceDate}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <Button variant="outline" size="sm" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Kalendarz
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edytuj
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

