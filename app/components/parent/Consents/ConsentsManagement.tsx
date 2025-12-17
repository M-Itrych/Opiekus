"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Shield,
  Camera,
  Heart,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApiConsent {
  id: string;
  childId: string;
  consentType: "IMAGE" | "DATA" | "MEDICAL";
  status: "ACCEPTED" | "PENDING" | "REJECTED";
  date: string;
  expiryDate: string | null;
  child: {
    id: string;
    name: string;
    surname: string;
  };
}

interface Child {
  id: string;
  name: string;
  surname: string;
}

const consentTypes = [
  { type: "IMAGE", label: "Zgoda na wizerunek", description: "Zgoda na publikację zdjęć i filmów z dzieckiem", icon: Camera },
  { type: "DATA", label: "Przetwarzanie danych", description: "Zgoda na przetwarzanie danych osobowych", icon: Shield },
  { type: "MEDICAL", label: "Dane medyczne", description: "Zgoda na przetwarzanie informacji o stanie zdrowia", icon: Heart },
];

export default function ConsentsManagement() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [consents, setConsents] = useState<ApiConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    try {
      const res = await fetch("/api/children");
      if (!res.ok) throw new Error("Błąd pobierania dzieci");
      const data = await res.json();
      setChildren(data);
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać listy dzieci");
    }
  }, [selectedChildId]);

  const fetchConsents = useCallback(async () => {
    if (!selectedChildId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/consents?childId=${selectedChildId}`);
      if (!res.ok) throw new Error("Błąd pobierania zgód");
      const data = await res.json();
      setConsents(data);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać zgód");
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (selectedChildId) {
      fetchConsents();
    }
  }, [selectedChildId, fetchConsents]);

  const handleConsentChange = async (consentType: string, newStatus: "ACCEPTED" | "REJECTED") => {
    if (!selectedChildId) return;

    setSaving(consentType);
    setError(null);

    try {
      const res = await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChildId,
          consentType,
          status: newStatus,
          expiryDate: newStatus === "ACCEPTED"
            ? new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString() // 3 years
            : null,
        }),
      });

      if (!res.ok) throw new Error("Błąd aktualizacji zgody");

      await fetchConsents();
    } catch (err) {
      console.error(err);
      setError("Nie udało się zaktualizować zgody");
    } finally {
      setSaving(null);
    }
  };

  const getConsentStatus = (type: string): "ACCEPTED" | "PENDING" | "REJECTED" | null => {
    const consent = consents.find((c) => c.consentType === type);
    return consent?.status || null;
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "PENDING":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-zinc-400" />;
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "ACCEPTED":
        return "Zaakceptowana";
      case "REJECTED":
        return "Odrzucona";
      case "PENDING":
        return "Oczekuje";
      default:
        return "Brak decyzji";
    }
  };

  const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "REJECTED":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      case "PENDING":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400";
      default:
        return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  if (children.length === 0 && !loading) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nie masz przypisanych dzieci</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Zarządzanie zgodami RODO
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Przeglądaj i zarządzaj zgodami dotyczącymi Twojego dziecka
          </p>
        </div>
        <div className="flex items-center gap-2">
          {children.length > 1 && (
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Wybierz dziecko" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name} {child.surname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={fetchConsents} variant="outline" size="icon" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      ) : (
        <div className="grid gap-4">
          {consentTypes.map((consentInfo) => {
            const status = getConsentStatus(consentInfo.type);
            const isSaving = saving === consentInfo.type;
            const IconComponent = consentInfo.icon;

            return (
              <div
                key={consentInfo.type}
                className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                          {consentInfo.label}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {consentInfo.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                  <Button
                    variant={status === "ACCEPTED" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleConsentChange(consentInfo.type, "ACCEPTED")}
                    disabled={isSaving}
                    className={status === "ACCEPTED" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Akceptuję
                  </Button>
                  <Button
                    variant={status === "REJECTED" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleConsentChange(consentInfo.type, "REJECTED")}
                    disabled={isSaving}
                    className={status === "REJECTED" ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Nie wyrażam zgody
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-sky-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Informacja o przetwarzaniu danych
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Twoje zgody są przetwarzane zgodnie z RODO. Możesz w każdej chwili zmienić swoją decyzję.
              Zgody są ważne przez 3 lata od momentu wyrażenia lub do zakończenia edukacji dziecka.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

