"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, Download, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface ConsentRecord {
  id: string;
  childName: string;
  parentName: string;
  consentType: "image" | "data" | "medical" | "marketing";
  status: "accepted" | "pending" | "rejected";
  date: string;
  expiryDate?: string;
}

const mockConsents: ConsentRecord[] = [
  {
    id: "1",
    childName: "Jan Kowalski",
    parentName: "Anna Kowalska",
    consentType: "image",
    status: "accepted",
    date: "2024-01-15",
    expiryDate: "2027-01-15",
  },
  {
    id: "2",
    childName: "Zuzanna Nowak",
    parentName: "Katarzyna Nowak",
    consentType: "image",
    status: "rejected",
    date: "2024-01-20",
  },
  {
    id: "3",
    childName: "Michał Wiśniewski",
    parentName: "Ewa Wiśniewska",
    consentType: "data",
    status: "accepted",
    date: "2024-01-10",
    expiryDate: "2027-01-10",
  },
  {
    id: "4",
    childName: "Lena Wójcik",
    parentName: "Agnieszka Wójcik",
    consentType: "medical",
    status: "pending",
    date: "2024-01-25",
  },
];

export default function RODOManagement() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredConsents = mockConsents.filter((consent) => {
    if (selectedFilter !== "all" && consent.status !== selectedFilter) return false;
    if (selectedType !== "all" && consent.consentType !== selectedType) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-5 w-5 text-sky-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-sky-500" />;
      case "pending":
        return <AlertCircle className="h-5 w-5 text-sky-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "accepted":
        return "Zaakceptowana";
      case "rejected":
        return "Odrzucona";
      case "pending":
        return "Oczekująca";
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "image":
        return "Zgoda na wizerunek";
      case "data":
        return "Zgoda na przetwarzanie danych";
      case "medical":
        return "Zgoda na dane medyczne";
      case "marketing":
        return "Zgoda marketingowa";
      default:
        return type;
    }
  };

  const generateReport = () => {
    alert("Generowanie raportu RODO...");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Zarządzanie zgodami RODO
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Kontrola nad wszystkimi zgodami rodziców - eliminacja papierowych zgód
          </p>
        </div>
        <Button onClick={generateReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Generuj raport
        </Button>
      </div>

      <div className="flex gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Status: {selectedFilter === "all" ? "Wszystkie" : getStatusLabel(selectedFilter)}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setSelectedFilter("all")}>
              Wszystkie
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedFilter("accepted")}>
              Zaakceptowane
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedFilter("pending")}>
              Oczekujące
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedFilter("rejected")}>
              Odrzucone
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
            <DropdownMenuItem onSelect={() => setSelectedType("image")}>
              Zgoda na wizerunek
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedType("data")}>
              Zgoda na przetwarzanie danych
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedType("medical")}>
              Zgoda na dane medyczne
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredConsents.map((consent) => (
          <div
            key={consent.id}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-4">
              {getStatusIcon(consent.status)}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {consent.childName}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    ({consent.parentName})
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <span>{getTypeLabel(consent.consentType)}</span>
                  <span>•</span>
                  <span>Data: {consent.date}</span>
                  {consent.expiryDate && (
                    <>
                      <span>•</span>
                      <span>Wygasa: {consent.expiryDate}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  consent.status === "accepted"
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                    : consent.status === "rejected"
                    ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                    : "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                }`}
              >
                {getStatusLabel(consent.status)}
              </span>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-sky-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Automatyczne archiwizowanie
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Wszystkie zgody są automatycznie archiwizowane. Okres retencji: 3 lata od zakończenia edukacji.
              Backup danych wykonywany codziennie.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

