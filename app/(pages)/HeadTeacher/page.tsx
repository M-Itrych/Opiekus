"use client";

import { useMemo, useState } from "react";
import Topbar from "@/app/components/global/TopBar/topbar";
import Navbar from "@/app/components/global/NavBar/navbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";

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

const grupy: Array<{
  name: string;
  counts: Record<AttendanceKey, number>;
}> = [
  {
    name: "Wszyscy uczniowie",
    counts: {
      present: 24,
      reported: 6,
      absent: 2,
    },
  },
  {
    name: "Grupa 1",
    counts: {
      present: 12,
      reported: 2,
      absent: 1,
    },
  },
  {
    name: "Grupa 2",
    counts: {
      present: 12,
      reported: 4,
      absent: 1,
    },
  },
];

export default function HeadTeacher() {
  const date = new Date();
  const [selectedGroupName, setSelectedGroupName] = useState(grupy[0]?.name);

  const selectedGroup = useMemo(
    () => grupy.find((group) => group.name === selectedGroupName) ?? grupy[0],
    [selectedGroupName]
  );

  const selectedStats = useMemo(
    () =>
      attendanceStatuses.map(({ key, ...rest }) => ({
        ...rest,
        value: selectedGroup?.counts[key] ?? 0,
      })),
    [selectedGroup]
  );

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-zinc-50 dark:bg-black">
      <aside className="flex w-64 min-w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-1 items-start justify-center py-6">
          <Navbar />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex flex-1 min-w-0 flex-col overflow-y-auto px-6 py-6 md:px-8">
          <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex w-full items-center justify-between gap-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Obecność grup
              </h2>
              <span className="h-fit rounded-md border-2 border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                {date.toLocaleDateString()}
              </span>
            </div>

            <div className="flex flex-col gap-4 rounded-xl ">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex w-full items-center justify-between gap-2 px-4"
                      >
                        <span>{selectedGroup?.name}</span>
                        <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {grupy.map(({ name, counts }) => {
                        const isActive = name === selectedGroup?.name;
                        const total =
                          counts.present + counts.reported + counts.absent;

                        return (
                          <DropdownMenuItem
                            key={name}
                            onSelect={() => setSelectedGroupName(name)}
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-sky-50 hover:text-sky-700 focus:bg-sky-50 focus:text-sky-700 dark:text-zinc-200 dark:hover:bg-sky-900/30 dark:hover:text-sky-200 dark:focus:bg-sky-900/30 dark:focus:text-sky-200"
                          >
                            <span>{name}</span>
                            <span className="flex items-center gap-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                              {total}
                              {isActive && <Check className="h-3.5 w-3.5 text-sky-500" />}
                            </span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {selectedStats.map(({ label, value, color, accent }) => (
                  <div
                    key={label}
                    className={`flex flex-col gap-2 rounded-xl p-4 transition-all duration-300 hover:shadow-md ${color}`}
                  >
                    <span className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                      {label}
                    </span>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold">{value}</span>
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
        </main>
      </div>
    </div>
  );
}
