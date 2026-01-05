"use client";

import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";

type AttendanceKey = "present" | "reported" | "absent";

interface AttendanceSummaryProps {
  dniDanych: Array<{
    date: Date;
    grupyData: Array<{
      name: string;
      counts: Record<AttendanceKey, number>;
    }>;
  }>;
  attendanceStatuses: Array<{
    key: AttendanceKey;
    label: string;
    color: string;
    accent: string;
  }>;
}

export default function AttendanceSummary({
  dniDanych,
  attendanceStatuses,
}: AttendanceSummaryProps) {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedGroupName, setSelectedGroupName] = useState(
    dniDanych[0]?.grupyData[0]?.name ?? ""
  );

  if (!dniDanych || dniDanych.length === 0) {
    return (
      <section className="flex w-full flex-col gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white px-3 sm:px-4 md:px-6 py-4 sm:py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Obecność grup
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Brak danych obecności</p>
      </section>
    );
  }

  const selectedDayData = dniDanych[selectedDateIndex];
  const selectedDate = selectedDayData.date;
  const availableGroups = selectedDayData.grupyData;

  const selectedGroup = useMemo(
    () =>
      availableGroups.find((group) => group.name === selectedGroupName) ??
      availableGroups[0],
    [availableGroups, selectedGroupName]
  );

  const selectedStats = useMemo(
    () =>
      attendanceStatuses.map(({ key, ...rest }) => ({
        key,
        ...rest,
        value: selectedGroup?.counts[key] ?? 0,
      })),
    [selectedGroup, attendanceStatuses]
  );
  return (
    <section className="flex w-full flex-col gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white px-3 sm:px-4 md:px-6 py-4 sm:py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col sm:flex-row w-full items-start sm:items-center sm:justify-between gap-3 sm:gap-6">
        <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Obecność grup
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center justify-between gap-2 px-3 sm:px-4 cursor-pointer text-xs sm:text-sm w-full sm:w-auto"
            >
              <span>{selectedDate.toLocaleDateString()}</span>
              <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            {dniDanych.map((dayData, index) => (
              <DropdownMenuItem
                key={dayData.date.toISOString()}
                onSelect={() => setSelectedDateIndex(index)}
                className="flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-700 transition-colors hover:bg-sky-50 hover:text-sky-700 focus:bg-sky-50 focus:text-sky-700 dark:text-zinc-200 dark:hover:bg-sky-900/30 dark:hover:text-sky-200 dark:focus:bg-sky-900/30 dark:focus:text-sky-200"
              >
                <span>{dayData.date.toLocaleDateString()}</span>
                {index === selectedDateIndex && (
                  <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sky-500" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex w-full sm:w-auto items-center justify-between gap-2 px-3 sm:px-4 cursor-pointer text-xs sm:text-sm"
                >
                  <span className="truncate">{selectedGroup?.name}</span>
                  <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-70 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
              >
                {availableGroups.map(({ name, counts }) => {
                  const isActive = name === selectedGroup?.name;
                  const total =
                    counts.present + counts.reported + counts.absent;

                  return (
                    <DropdownMenuItem
                      key={name}
                      onSelect={() => setSelectedGroupName(name)}
                      className="flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-700 transition-colors hover:bg-sky-50 hover:text-sky-700 focus:bg-sky-50 focus:text-sky-700 dark:text-zinc-200 dark:hover:bg-sky-900/30 dark:hover:text-sky-200 dark:focus:bg-sky-900/30 dark:focus:text-sky-200"
                    >
                      <span className="truncate">{name}</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
                        {total}
                        {isActive && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sky-500" />}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-3">
          {selectedStats.map(({ label, value, color, accent }) => (
            <div
              key={label}
              className={`flex flex-col gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300 hover:shadow-md ${color}`}
            >
              <span className="text-xs sm:text-sm font-medium uppercase tracking-wide text-zinc-500">
                {label}
              </span>
              <div className="flex items-end justify-between">
                <span className="text-2xl sm:text-3xl font-bold">{value}</span>
                <span
                  className={`h-2 w-2 rounded-full ${accent}`}
                  aria-hidden
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

