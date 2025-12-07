"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, Download, FileText, Loader2, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface ApiConsent {
  id: string;
  childId: string;
  consentType: "IMAGE" | "DATA" | "MEDICAL" | "MARKETING";
  status: "ACCEPTED" | "PENDING" | "REJECTED";
  date: string;
  expiryDate: string | null;
  child: {
    id: string;
    name: string;
    surname: string;
    parent?: {
      id: string;
      name: string;
      surname: string;
    };
  };
}

interface ConsentRecord {
  id: string;
  childName: string;
  parentName: string;
  consentType: "image" | "data" | "medical" | "marketing";
  status: "accepted" | "pending" | "rejected";
  date: string;
  expiryDate?: string;
}

export default function RODOManagement() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const fetchConsents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedFilter !== "all") {
        params.append("status", selectedFilter.toUpperCase());
      }
      if (selectedType !== "all") {
        params.append("consentType", selectedType.toUpperCase());
      }

      const res = await fetch(`/api/consents?${params.toString()}`);
      if (!res.ok) throw new Error("Błąd pobierania zgód");

      const data: ApiConsent[] = await res.json();

      const mappedConsents: ConsentRecord[] = data.map((consent) => ({
        id: consent.id,
        childName: `${consent.child.name} ${consent.child.surname}`,
        parentName: consent.child.parent
          ? `${consent.child.parent.name} ${consent.child.parent.surname}`
          : "Nieznany rodzic",
        consentType: consent.consentType.toLowerCase() as ConsentRecord["consentType"],
        status: consent.status.toLowerCase() as ConsentRecord["status"],
        date: new Date(consent.date).toLocaleDateString("pl-PL"),
        expiryDate: consent.expiryDate
          ? new Date(consent.expiryDate).toLocaleDateString("pl-PL")
          : undefined,
      }));

      setConsents(mappedConsents);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać zgód");
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, selectedType]);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  const filteredConsents = consents.filter((consent) => {
    if (selectedFilter !== "all" && consent.status !== selectedFilter) return false;
    if (selectedType !== "all" && consent.consentType !== selectedType) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
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

  const generateReport = async () => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Raport RODO - ${new Date().toLocaleDateString("pl-PL")}`,
          content: `Raport zawiera ${consents.length} zgód.\n\nZaakceptowane: ${consents.filter(c => c.status === "accepted").length}\nOczekujące: ${consents.filter(c => c.status === "pending").length}\nOdrzucone: ${consents.filter(c => c.status === "rejected").length}`,
          reportType: "rodo",
          periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          periodEnd: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Błąd generowania raportu");

      alert("Raport RODO został wygenerowany i zapisany.");
    } catch (err) {
      console.error(err);
      alert("Nie udało się wygenerować raportu");
    }
  };

  if (loading) {
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
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Zarządzanie zgodami RODO
            </h3>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchConsents} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          <Button onClick={fetchConsents} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={generateReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Generuj raport
          </Button>
        </div>
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
            <DropdownMenuItem onSelect={() => setSelectedType("marketing")}>
              Zgoda marketingowa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredConsents.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Brak zgód do wyświetlenia</p>
        </div>
      ) : (
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
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : consent.status === "rejected"
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                  }`}
                >
                  {getStatusLabel(consent.status)}
                </span>
                <Button variant="outline" size="sm" aria-label="Zobacz szczegóły">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

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
