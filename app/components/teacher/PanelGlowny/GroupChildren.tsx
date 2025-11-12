"use client";

import { useState } from "react";
import { Search, AlertCircle, CheckCircle, Camera, CameraOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Child {
  id: string;
  name: string;
  surname: string;
  age: number;
  hasImageConsent: boolean;
  hasDataConsent: boolean;
  allergies?: string[];
  specialNeeds?: string;
  pickupAuthorized: string[];
}

interface GroupChildrenProps {
  children: Child[];
  groupName: string;
}

export default function GroupChildren({ children, groupName }: GroupChildrenProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChildren = children.filter(
    (child) =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.surname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = children.length;
  const absentCount = 0; // This would come from attendance data

  return (
    <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {groupName}
          </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-sky-600">{presentCount}</span> obecnych
                {absentCount > 0 && (
                  <span className="ml-2">
                    / <span className="font-semibold text-sky-500">{absentCount}</span> nieobecnych
                  </span>
                )}
              </div>
            </div>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Lista dzieci w grupie z informacjami o zgodach i upoważnieniach.
        </p>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredChildren.map((child) => (
          <div
            key={child.id}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {child.name} {child.surname}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {child.age} lat
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                {child.hasImageConsent ? (
                  <div className="flex items-center gap-1 text-sky-600">
                    <Camera className="h-4 w-4" />
                    <span>Zgoda na zdjęcia</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sky-500">
                    <CameraOff className="h-4 w-4" />
                    <span className="font-semibold">Brak zgody na zdjęcia</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                {child.hasDataConsent ? (
                  <div className="flex items-center gap-1 text-sky-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Zgoda RODO</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sky-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>Brak zgody RODO</span>
                  </div>
                )}
              </div>

              {child.allergies && child.allergies.length > 0 && (
                <div className="mt-2 rounded-lg bg-sky-50 px-3 py-2 dark:bg-sky-900/20">
                  <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                    Alergie: {child.allergies.join(", ")}
                  </p>
                </div>
              )}

              {child.specialNeeds && (
                <div className="mt-1 rounded-lg bg-sky-50 px-3 py-2 dark:bg-sky-900/20">
                  <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
                    {child.specialNeeds}
                  </p>
                </div>
              )}

              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                <p className="font-medium">Upoważnieni do odbioru:</p>
                <p className="mt-1">{child.pickupAuthorized.length} osoby</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => {
              }}
            >
              Szczegóły
            </Button>
          </div>
        ))}
      </div>

      {filteredChildren.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            Nie znaleziono dzieci pasujących do wyszukiwania.
          </p>
        </div>
      )}
    </section>
  );
}

