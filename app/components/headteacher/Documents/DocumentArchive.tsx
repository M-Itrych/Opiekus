"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Download, Calendar, User, Loader2, RefreshCcw } from "lucide-react";
import { useModal } from "@/app/components/global/Modal/ModalContext";

interface ApiDocument {
  id: string;
  name: string;
  type: string;
  status: 'AKTYWNY' | 'ARCHIWALNY';
  fileUrl: string | null;
  childId: string | null;
  uploadedBy: string;
  createdAt: string;
  child: {
    id: string;
    name: string;
    surname: string;
  } | null;
}

export default function DocumentArchive() {
  const { showModal } = useModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'AKTYWNY' | 'ARCHIWALNY'>('all');

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (!res.ok) throw new Error('Błąd pobierania dokumentów');

      const data: ApiDocument[] = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      setError('Nie udało się pobrać dokumentów');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = documents.filter((doc) => {
    const nameMatch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const childMatch = doc.child
      ? `${doc.child.name} ${doc.child.surname}`.toLowerCase().includes(searchQuery.toLowerCase())
      : false;
    return nameMatch || childMatch;
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      umowa: "Umowa",
      regulamin: "Regulamin",
      cennik: "Cennik",
      karta_dziecka: "Karta dziecka",
      badania: "Badania lekarskie",
      szczepienia: "Karta szczepień",
      inne: "Inne",
    };
    return labels[type.toLowerCase()] || type;
  };

  const handleDownload = (doc: ApiDocument) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    } else {
      showModal('warning', 'Plik nie jest dostępny do pobrania');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Archiwum dokumentów
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Automatyczne archiwizowanie - koniec z szafami segregatorów
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          <span className="ml-2 text-zinc-600">Ładowanie dokumentów...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Archiwum dokumentów
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDocuments} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Archiwum dokumentów
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Automatyczne archiwizowanie - koniec z szafami segregatorów
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Szukaj dokumentów..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'AKTYWNY' | 'ARCHIWALNY')}
          className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="all">Wszystkie statusy</option>
          <option value="AKTYWNY">Aktywne</option>
          <option value="ARCHIWALNY">Archiwalne</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-500 dark:text-zinc-400">
              {searchQuery ? 'Nie znaleziono dokumentów spełniających kryteria' : 'Brak dokumentów do wyświetlenia'}
            </p>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
                  <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {doc.name}
                  </span>
                  <div className="flex items-center gap-4 mt-1 text-sm text-zinc-600 dark:text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {getTypeLabel(doc.type)}
                    </span>
                    {doc.child && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {doc.child.name} {doc.child.surname}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(doc.createdAt).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${doc.status === "AKTYWNY"
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                >
                  {doc.status === "AKTYWNY" ? "Aktywny" : "Archiwalny"}
                </span>
                <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
