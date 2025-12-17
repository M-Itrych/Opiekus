"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar, BarChart, Shield, Users, Loader2, RefreshCcw, Plus, Eye, X, Trash2, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { downloadReportPDF } from "./ReportPDF";
import { useModal } from "@/app/components/global/Modal/ModalContext";

interface ApiReport {
  id: string;
  title: string;
  content: string;
  reportType: string;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    surname: string;
  };
}

export default function ReportsList() {
  const { showModal } = useModal();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<ApiReport | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedType !== 'all') {
        params.append('reportType', selectedType);
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error('Błąd pobierania raportów');

      const data: ApiReport[] = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
      setError('Nie udało się pobrać raportów');
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
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
    return labels[type.toLowerCase()] || type;
  };

  const generateReport = async (reportType: string) => {
    setGenerating(reportType);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
        }),
      });

      if (!res.ok) throw new Error('Błąd generowania raportu');

      await fetchReports();
      alert(`Raport "${reportNames[reportType]}" został wygenerowany`);
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd podczas generowania raportu');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = (report: ApiReport) => {
    if (report.fileUrl) {
      window.open(report.fileUrl, '_blank');
    } else {
      alert('Plik raportu nie jest jeszcze dostępny do pobrania');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            System raportowania
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Generowanie raportów dla kontroli RODO, kuratorium i innych instytucji
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          <span className="ml-2 text-zinc-600">Ładowanie raportów...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            System raportowania
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchReports} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {viewingReport && (
        <ReportViewerModal report={viewingReport} onClose={() => setViewingReport(null)} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            System raportowania
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Generowanie raportów dla kontroli RODO, kuratorium i innych instytucji
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" disabled={generating !== null}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Generuj raport
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() => generateReport("rodo")}
                disabled={generating !== null}
              >
                <Shield className="mr-2 h-4 w-4" />
                RODO (Zgody)
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => generateReport("obecnosc")}
                disabled={generating !== null}
              >
                <Users className="mr-2 h-4 w-4" />
                Obecność
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => generateReport("finansowy")}
                disabled={generating !== null}
              >
                <BarChart className="mr-2 h-4 w-4" />
                Finansowy
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => generateReport("statystyki")}
                disabled={generating !== null}
              >
                <BarChart className="mr-2 h-4 w-4" />
                Statystyki grup
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <FileText className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">
              Brak raportów do wyświetlenia. Kliknij &quot;Generuj raport&quot;, aby utworzyć nowy.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(report.reportType)}
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {report.title}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {getTypeLabel(report.reportType)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                {report.content.substring(0, 150)}...
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(report.createdAt).toLocaleDateString('pl-PL')}</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Autor: {report.author.name} {report.author.surname}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingReport(report)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={downloadingPdf === report.id}
                      >
                        {downloadingPdf === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleDownloadPdf(report)}>
                        <FileDown className="mr-2 h-4 w-4 text-red-500" />
                        PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleDownload(report)}>
                        <FileText className="mr-2 h-4 w-4 text-blue-500" />
                        Markdown
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(report)}
                    disabled={deleting === report.id}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {deleting === report.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

