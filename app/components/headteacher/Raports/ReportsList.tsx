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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Błąd generowania raportu');
      }

      const newReport: ApiReport = await res.json();
      await fetchReports();
      setViewingReport(newReport);
    } catch (err) {
      console.error(err);
      showModal('error', err instanceof Error ? err.message : 'Wystąpił błąd podczas generowania raportu');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = (report: ApiReport) => {
    // Create a downloadable text file with the report content
    const blob = new Blob([report.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]/g, '')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async (report: ApiReport) => {
    setDownloadingPdf(report.id);
    try {
      await downloadReportPDF(report);
    } catch (err) {
      console.error(err);
      showModal('error', 'Wystąpił błąd podczas generowania PDF');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleDelete = async (report: ApiReport) => {
    if (!confirm(`Czy na pewno chcesz usunąć raport "${report.title}"?`)) {
      return;
    }

    setDeleting(report.id);
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Błąd usuwania raportu');
      }

      await fetchReports();
    } catch (err) {
      console.error(err);
      showModal('error', 'Wystąpił błąd podczas usuwania raportu');
    } finally {
      setDeleting(null);
    }
  };

  // Report viewer modal
  const ReportViewerModal = ({ report, onClose }: { report: ApiReport; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="relative max-h-[95vh] sm:max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg sm:rounded-2xl bg-white shadow-xl dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 border-b border-zinc-200 p-3 sm:p-4 dark:border-zinc-700">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="shrink-0">{getTypeIcon(report.reportType)}</div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">{report.title}</h3>
              <p className="text-xs sm:text-sm text-zinc-500">{new Date(report.createdAt).toLocaleDateString('pl-PL')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={downloadingPdf === report.id} className="text-xs sm:text-sm">
                  {downloadingPdf === report.id ? (
                    <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline">Pobierz</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => handleDownloadPdf(report)}>
                  <FileDown className="mr-2 h-4 w-4 text-red-500" />
                  Pobierz PDF
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDownload(report)}>
                  <FileText className="mr-2 h-4 w-4 text-blue-500" />
                  Pobierz Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-80px)] overflow-auto p-3 sm:p-6">
          <div className="prose prose-zinc dark:prose-invert max-w-none whitespace-pre-wrap font-mono text-xs sm:text-sm">
            {report.content}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            System raportowania
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Generowanie raportów dla kontroli RODO, kuratorium i innych instytucji
          </p>
        </div>
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-sky-600" />
          <span className="ml-2 text-xs sm:text-sm text-zinc-600">Ładowanie raportów...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            System raportowania
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
          <p className="text-xs sm:text-sm text-red-600 mb-4">{error}</p>
          <Button onClick={fetchReports} variant="outline" size="sm" className="text-xs sm:text-sm">
            <RefreshCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {viewingReport && (
        <ReportViewerModal report={viewingReport} onClose={() => setViewingReport(null)} />
      )}

      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            System raportowania
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Generowanie raportów dla kontroli RODO, kuratorium i innych instytucji
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center" disabled={generating !== null}>
                {generating ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">Generowanie...</span>
                    <span className="sm:hidden">Generowanie</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Generuj raport</span>
                    <span className="sm:hidden">Generuj</span>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
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
              <Button variant="outline" className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center">
                <span className="hidden sm:inline">Typ: </span>
                {selectedType === "all" ? "Wszystkie" : getTypeLabel(selectedType)}
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
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

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        {reports.length === 0 ? (
          <div className="col-span-1 md:col-span-2 rounded-lg sm:rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-zinc-400 mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Brak raportów do wyświetlenia. Kliknij &quot;Generuj raport&quot;, aby utworzyć nowy.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="flex flex-col gap-3 sm:gap-4 rounded-lg sm:rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="shrink-0 mt-0.5">{getTypeIcon(report.reportType)}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 break-words">
                      {report.title}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {getTypeLabel(report.reportType)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 break-words">
                {report.content.substring(0, 150)}...
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span>{new Date(report.createdAt).toLocaleDateString('pl-PL')}</span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">
                    Autor: {report.author.name} {report.author.surname}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 justify-end sm:justify-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingReport(report)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={downloadingPdf === report.id}
                        className="h-8 w-8 p-0"
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
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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

