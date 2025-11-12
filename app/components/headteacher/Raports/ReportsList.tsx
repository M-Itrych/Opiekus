"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar, BarChart, Shield, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface Report {
  id: string;
  name: string;
  type: "rodo" | "obecnosc" | "finansowy" | "statystyki" | "sygnalisci";
  date: string;
  description: string;
}

const mockReports: Report[] = [
  {
    id: "1",
    name: "Raport RODO - Zgody rodziców",
    type: "rodo",
    date: "2024-01-25",
    description: "Kompletny raport wszystkich zgód rodziców na przetwarzanie danych",
  },
  {
    id: "2",
    name: "Raport obecności - Styczeń 2024",
    type: "obecnosc",
    date: "2024-01-31",
    description: "Statystyki obecności dzieci we wszystkich grupach",
  },
  {
    id: "3",
    name: "Raport finansowy - Q1 2024",
    type: "finansowy",
    date: "2024-03-31",
    description: "Podsumowanie finansowe pierwszego kwartału",
  },
  {
    id: "4",
    name: "Statystyki grup - 2024",
    type: "statystyki",
    date: "2024-01-25",
    description: "Analiza statystyczna wszystkich grup przedszkolnych",
  },
  {
    id: "5",
    name: "Rejestr sygnalistów - 2024",
    type: "sygnalisci",
    date: "2024-01-25",
    description: "Rejestr zgłoszeń zgodnie z ustawą o sygnalistach",
  },
];

export default function ReportsList() {
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredReports = mockReports.filter(
    (report) => selectedType === "all" || report.type === selectedType
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "rodo":
        return <Shield className="h-5 w-5 text-sky-600" />;
      case "obecnosc":
        return <Users className="h-5 w-5 text-sky-600" />;
      case "finansowy":
        return <BarChart className="h-5 w-5 text-sky-600" />;
      case "statystyki":
        return <BarChart className="h-5 w-5 text-sky-600" />;
      case "sygnalisci":
        return <Shield className="h-5 w-5 text-sky-600" />;
      default:
        return <FileText className="h-5 w-5 text-zinc-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rodo: "RODO",
      obecnosc: "Obecność",
      finansowy: "Finansowy",
      statystyki: "Statystyki",
      sygnalisci: "Sygnaliści",
    };
    return labels[type] || type;
  };

  const generateReport = (reportId: string) => {
    alert(`Generowanie raportu: ${mockReports.find((r) => r.id === reportId)?.name}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            System raportowania
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Generowanie raportów dla kontroli RODO, kuratorium i innych instytucji
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Typ: {selectedType === "all" ? "Wszystkie" : getTypeLabel(selectedType)}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setSelectedType("all")}>
              Wszystkie
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedType("rodo")}>
              RODO
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedType("obecnosc")}>
              Obecność
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedType("finansowy")}>
              Finansowy
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedType("statystyki")}>
              Statystyki
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedType("sygnalisci")}>
              Sygnaliści
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getTypeIcon(report.type)}
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {report.name}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {getTypeLabel(report.type)}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {report.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Calendar className="h-4 w-4" />
                <span>{report.date}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateReport(report.id)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Pobierz
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

