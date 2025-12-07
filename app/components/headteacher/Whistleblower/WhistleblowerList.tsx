"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import WhistleblowerModal from "./WhistleblowerModal";

interface WhistleblowerReport {
  id: string;
  title: string;
  content: string;
  category: string | null;
  isAnonymous: boolean;
  reporterEmail: string | null;
  status: "NEW" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function WhistleblowerList() {
  const [reports, setReports] = useState<WhistleblowerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<WhistleblowerReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }

      const res = await fetch(`/api/whistleblower?${params.toString()}`);
      if (!res.ok) throw new Error("Błąd pobierania zgłoszeń");

      const data: WhistleblowerReport[] = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać zgłoszeń");
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NEW":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "IN_REVIEW":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "RESOLVED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "DISMISSED":
        return <XCircle className="h-5 w-5 text-zinc-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-zinc-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: "Nowe",
      IN_REVIEW: "W trakcie",
      RESOLVED: "Rozwiązane",
      DISMISSED: "Odrzucone",
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "IN_REVIEW":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "RESOLVED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "DISMISSED":
        return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
      default:
        return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  const handleViewReport = (report: WhistleblowerReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const handleUpdateReport = async (id: string, status: string, resolution?: string) => {
    try {
      const res = await fetch(`/api/whistleblower/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution }),
      });

      if (!res.ok) throw new Error("Błąd aktualizacji");

      await fetchReports();
      handleCloseModal();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchReports} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Moduł Sygnalistów
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Zarządzanie zgłoszeniami sygnalistów zgodnie z ustawą
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {selectedStatus === "all" ? "Wszystkie" : getStatusLabel(selectedStatus)}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setSelectedStatus("all")}>
                Wszystkie
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedStatus("NEW")}>
                Nowe
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedStatus("IN_REVIEW")}>
                W trakcie
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedStatus("RESOLVED")}>
                Rozwiązane
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedStatus("DISMISSED")}>
                Odrzucone
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={fetchReports} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Brak zgłoszeń do wyświetlenia</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {getStatusIcon(report.status)}
                <div>
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                    {report.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(
                        report.status
                      )}`}
                    >
                      {getStatusLabel(report.status)}
                    </span>
                    {report.category && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        • {report.category}
                      </span>
                    )}
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      • {new Date(report.createdAt).toLocaleDateString("pl-PL")}
                    </span>
                    {report.isAnonymous && (
                      <span className="text-xs text-zinc-400 italic">• Anonimowe</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewReport(report)}
                aria-label={`Zobacz szczegóły zgłoszenia ${report.title}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Szczegóły
              </Button>
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <WhistleblowerModal
          report={selectedReport}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdate={handleUpdateReport}
        />
      )}
    </div>
  );
}

