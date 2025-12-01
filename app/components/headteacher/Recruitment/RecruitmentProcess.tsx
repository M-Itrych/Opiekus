"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Mail,
  Phone,
  Search,
  UserPlus,
  XCircle,
} from "lucide-react";
import { RecruitmentModal } from "./RecruitmentModal";

interface RecruitmentApplication {
  id: string;
  childName: string;
  childSurname: string;
  childAge: number;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parent2Name: string | null;
  parent2Email: string | null;
  parent2Phone: string | null;
  applicationDate: string;
  status: "PENDING" | "VERIFIED" | "ACCEPTED" | "REJECTED";
  birthCertificate: boolean;
  medicalExamination: boolean;
  vaccinationCard: boolean;
  photos: boolean;
  notes: string | null;
  child: {
    id: string;
    name: string;
    surname: string;
    group?: { id: string; name: string } | null;
  } | null;
}

const statusLabels: Record<string, string> = {
  PENDING: "Oczekująca",
  VERIFIED: "Zweryfikowana",
  ACCEPTED: "Zaakceptowana",
  REJECTED: "Odrzucona",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  VERIFIED: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  ACCEPTED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function RecruitmentProcess() {
  const [applications, setApplications] = useState<RecruitmentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/recruitment");
      if (!response.ok) {
        throw new Error("Nie udało się pobrać wniosków");
      }
      const data: RecruitmentApplication[] = await response.json();
      setApplications(data);
    } catch (err) {
      console.error("Error fetching recruitment applications:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Wystąpił błąd podczas ładowania wniosków"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true;
    const haystack = `${app.childName} ${app.childSurname} ${app.parentName}`.toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "VERIFIED":
        return <CheckCircle2 className="h-5 w-5 text-sky-600" />;
      case "PENDING":
      default:
        return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  const getDocumentsCount = (app: RecruitmentApplication) => {
    return [
      app.birthCertificate,
      app.medicalExamination,
      app.vaccinationCard,
      app.photos,
    ].filter(Boolean).length;
  };

  const handleOpenModal = (id: string | null = null) => {
    setSelectedApplicationId(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplicationId(null);
  };

  const handleSuccess = () => {
    fetchApplications();
  };

  const handleCreateNew = () => {
    setSelectedApplicationId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <RecruitmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        applicationId={selectedApplicationId}
        onSuccess={handleSuccess}
      />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Proces rekrutacji
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Przyjęcie dziecka: weryfikacja email, rejestracja w systemie, wypełnienie formularzy online
          </p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-sky-600 text-white hover:bg-sky-500"
          onClick={handleCreateNew}
        >
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

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="py-10 text-center text-sm text-zinc-500">
          Brak wniosków spełniających kryteria.
        </div>
      ) : (
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
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Rodzic: {app.parentName}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[app.status]}`}>
                  {statusLabels[app.status]}
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
                  <span>
                    Data wniosku: {format(new Date(app.applicationDate), "dd.MM.yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <FileText className="h-4 w-4" />
                  <span>Dokumenty: {getDocumentsCount(app)}/4</span>
                </div>
              </div>

              <div className="flex gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenModal(app.id)}
                >
                  Szczegóły
                </Button>
                {app.status === "PENDING" && (
                  <Button
                    size="sm"
                    className="flex-1 bg-sky-600 text-white hover:bg-sky-500"
                    onClick={() => handleOpenModal(app.id)}
                  >
                    Zweryfikuj
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
