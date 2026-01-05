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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type ChartConfig } from "@/components/ui/chart";

type AttendanceKey = "present" | "reported" | "absent";

const chartConfig = {
  present: {
    label: "Obecni",
    color: "var(--chart-1)",
  },
  reported: {
    label: "Zgłoszone nieobecności",
    color: "var(--chart-2)",
  },
  absent: {
    label: "Nieobecni",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

interface AttendanceChartProps {
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

export default function AttendanceChart({
  dniDanych,
  attendanceStatuses,
}: AttendanceChartProps) {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedGroupName, setSelectedGroupName] = useState(
    dniDanych[0]?.grupyData[0]?.name ?? ""
  );

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
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Wykres obecności
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
                const total = counts.present + counts.reported + counts.absent;

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
      <div className="overflow-x-auto">
        <ChartContainer config={chartConfig} className="h-64 w-full min-w-[300px] sm:min-w-[400px] md:max-w-xl">
          <BarChart
            data={selectedStats}
            layout="vertical"
            margin={{ top: 12, right: 16, left: 8, bottom: 12 }}
            barSize={20}
            barCategoryGap={24}
          >
            <CartesianGrid horizontal={false} strokeDasharray="4 8" />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <XAxis type="number" hide domain={[0, "dataMax + 5"]} />
            <ChartTooltip
              cursor={{ fill: "rgba(15, 118, 110, 0.08)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={() => "Szczegóły"}
                  formatter={(value, _name, entry) => {
                    const key = (entry?.payload as { key?: AttendanceKey })?.key;
                    const configEntry = key ? chartConfig[key] : undefined;
                    const label = configEntry?.label ?? (entry?.payload as { label?: string })?.label ?? "";

                    return (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {Number(value).toLocaleString()}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {selectedStats.map((item) => (
                <Cell key={item.key} fill={`var(--color-${item.key})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </section>
  );
}

