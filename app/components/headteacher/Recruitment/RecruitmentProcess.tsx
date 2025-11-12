"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Mail, Phone, Calendar, FileText, CheckCircle, Clock, XCircle } from "lucide-react";

interface RecruitmentApplication {
  id: string;
  childName: string;
  childSurname: string;
  childAge: number;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  applicationDate: string;
  status: "pending" | "verified" | "accepted" | "rejected";
  documentsStatus: {
    birthCertificate: boolean;
    medicalExamination: boolean;
    vaccinationCard: boolean;
    photos: boolean;
  };
}

const mockApplications: RecruitmentApplication[] = [
  {
    id: "1",
    childName: "Oliwia",
    childSurname: "Kowalczyk",
    childAge: 3,
    parentName: "Magdalena Kowalczyk",
    parentEmail: "m.kowalczyk@email.com",
    parentPhone: "+48 123 456 793",
    applicationDate: "2024-01-20",
    status: "pending",
    documentsStatus: {
      birthCertificate: true,
      medicalExamination: false,
      vaccinationCard: true,
      photos: false,
    },
  },
  {
    id: "2",
    childName: "Filip",
    childSurname: "Nowak",
    childAge: 4,
    parentName: "Tomasz Nowak",
    parentEmail: "t.nowak@email.com",
    parentPhone: "+48 123 456 794",
    applicationDate: "2024-01-18",
    status: "verified",
    documentsStatus: {
      birthCertificate: true,
      medicalExamination: true,
      vaccinationCard: true,
      photos: true,
    },
  },
];

export default function RecruitmentProcess() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredApplications = mockApplications.filter(
    (app) =>
      `${app.childName} ${app.childSurname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.parentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-5 w-5 text-sky-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-sky-500" />;
      case "verified":
        return <CheckCircle className="h-5 w-5 text-sky-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-sky-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Oczekująca",
      verified: "Zweryfikowana",
      accepted: "Zaakceptowana",
      rejected: "Odrzucona",
    };
    return labels[status] || status;
  };

  const getDocumentsCount = (documents: RecruitmentApplication["documentsStatus"]) => {
    return Object.values(documents).filter(Boolean).length;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Proces rekrutacji
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Przyjęcie dziecka: weryfikacja email, rejestracja w systemie, wypełnienie formularzy online
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Nowa rekrutacja
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder="Szukaj wniosków..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredApplications.map((app) => (
          <div
            key={app.id}
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(app.status)}
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {app.childName} {app.childSurname} ({app.childAge} lat)
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Rodzic: {app.parentName}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  app.status === "accepted"
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                    : app.status === "rejected"
                    ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                    : app.status === "verified"
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                    : "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                }`}
              >
                {getStatusLabel(app.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Mail className="h-4 w-4" />
                <span>{app.parentEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Phone className="h-4 w-4" />
                <span>{app.parentPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Calendar className="h-4 w-4" />
                <span>Data wniosku: {app.applicationDate}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <FileText className="h-4 w-4" />
                <span>Dokumenty: {getDocumentsCount(app.documentsStatus)}/4</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <Button variant="outline" size="sm" className="flex-1">
                Szczegóły
              </Button>
              {app.status === "pending" && (
                <>
                  <Button size="sm" className="flex-1">
                    Zaakceptuj
                  </Button>
                  <Button variant="outline" size="sm" className="text-sky-600">
                    Odrzuć
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

