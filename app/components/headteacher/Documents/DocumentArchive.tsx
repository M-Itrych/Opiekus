"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Download, Calendar, User } from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: "umowa" | "regulamin" | "cennik" | "karta_dziecka" | "badania" | "szczepienia" | "inne";
  childName?: string;
  date: string;
  status: "aktywny" | "archiwalny";
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Umowa - Jan Kowalski",
    type: "umowa",
    childName: "Jan Kowalski",
    date: "2024-01-15",
    status: "aktywny",
  },
  {
    id: "2",
    name: "Regulamin przedszkola 2024",
    type: "regulamin",
    date: "2024-01-01",
    status: "aktywny",
  },
  {
    id: "3",
    name: "Cennik 2024/2025",
    type: "cennik",
    date: "2024-01-01",
    status: "aktywny",
  },
  {
    id: "4",
    name: "Karta dziecka - Zuzanna Nowak",
    type: "karta_dziecka",
    childName: "Zuzanna Nowak",
    date: "2024-01-20",
    status: "aktywny",
  },
  {
    id: "5",
    name: "Badania lekarskie - Michał Wiśniewski",
    type: "badania",
    childName: "Michał Wiśniewski",
    date: "2023-12-10",
    status: "aktywny",
  },
];

export default function DocumentArchive() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocuments = mockDocuments.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.childName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    return labels[type] || type;
  };

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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder="Szukaj dokumentów..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredDocuments.map((doc) => (
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
                <div className="flex items-center gap-4 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {getTypeLabel(doc.type)}
                  </span>
                  {doc.childName && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {doc.childName}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {doc.date}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  doc.status === "aktywny"
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {doc.status === "aktywny" ? "Aktywny" : "Archiwalny"}
              </span>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

