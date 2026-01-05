"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, AlertCircle, CheckCircle, Camera, CameraOff, Loader2, X, Phone, Mail, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Parent {
  id: string;
  name: string;
  surname: string;
  phone?: string | null;
  email: string;
}

interface Child {
  id: string;
  name: string;
  surname: string;
  age: number;
  hasImageConsent: boolean;
  hasDataConsent: boolean;
  allergies?: string[];
  specialNeeds?: string | null;
  parent?: Parent;
}

interface GroupChildrenProps {
  groupName?: string;
}

export default function GroupChildren({ groupName = "Moja grupa" }: GroupChildrenProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/groups/children");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Nie udało się pobrać danych dzieci");
      }
      const data = await res.json();
      setChildren(data);
    } catch (err) {
      console.error("Error fetching children:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas pobierania danych");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const filteredChildren = children.filter(
    (child) =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.surname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <section className="flex w-full flex-col gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white px-3 sm:px-4 md:px-6 py-4 sm:py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-center py-6 sm:py-8">
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-sky-600" />
          <span className="ml-2 text-xs sm:text-sm text-zinc-600">Ładowanie danych grupy...</span>
        </div>
      </section>
    );
  }

  if (error) {
    if (error === "Brak przypisanej grupy") {
      return (
        <section className="flex w-full flex-col gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white px-3 sm:px-4 md:px-6 py-4 sm:py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 py-8 sm:py-12">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-zinc-400" />
            </div>
            <div className="text-center px-4">
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Brak przypisanej grupy
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
                Nie jesteś obecnie przypisany do żadnej grupy. Skontaktuj się z dyrektorem, aby zostać przypisanym do grupy.
              </p>
            </div>
            <Button
              onClick={fetchChildren}
              variant="outline"
              className="mt-2 text-xs sm:text-sm"
            >
              Odśwież
            </Button>
          </div>
        </section>
      );
    }

    return (
      <section className="flex w-full flex-col gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-red-200 bg-red-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6 shadow-sm dark:border-red-800 dark:bg-red-900/20">
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 py-6 sm:py-8">
          <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
          <p className="text-center text-xs sm:text-sm text-red-600 dark:text-red-400 px-4">{error}</p>
          <Button
            onClick={fetchChildren}
            variant="outline"
            className="mt-2 text-xs sm:text-sm"
          >
            Spróbuj ponownie
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="flex w-full flex-col gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white px-3 sm:px-4 md:px-6 py-4 sm:py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {groupName}
            </h2>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-sky-600">{children.length}</span> dzieci w grupie
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Lista dzieci w grupie z informacjami o zgodach i upoważnieniach.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Szukaj dziecka..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-10 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredChildren.map((child) => (
            <div
              key={child.id}
              className="flex flex-col gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-semibold dark:bg-sky-900/30 shrink-0 text-xs sm:text-sm">
                    {child.name[0]}{child.surname[0]}
                  </div>
                  <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {child.name} {child.surname}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                      {child.age} lat
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  {child.hasImageConsent ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Camera className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">Zgoda na zdjęcia</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-500">
                      <CameraOff className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="font-semibold truncate">Brak zgody na zdjęcia</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  {child.hasDataConsent ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span>Zgoda RODO</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span>Brak zgody RODO</span>
                    </div>
                  )}
                </div>

                {child.allergies && child.allergies.length > 0 && (
                  <div className="mt-1 sm:mt-2 rounded-lg bg-amber-50 px-2 sm:px-3 py-1.5 sm:py-2 dark:bg-amber-900/20">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      Alergie: {child.allergies.join(", ")}
                    </p>
                  </div>
                )}

                {child.specialNeeds && (
                  <div className="mt-1 rounded-lg bg-blue-50 px-2 sm:px-3 py-1.5 sm:py-2 dark:bg-blue-900/20">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      {child.specialNeeds}
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="mt-1 sm:mt-2 w-full text-xs sm:text-sm"
                onClick={() => setSelectedChild(child)}
              >
                Szczegóły
              </Button>
            </div>
          ))}
        </div>

        {filteredChildren.length === 0 && (
          <div className="py-8 sm:py-12 text-center">
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              {children.length === 0
                ? "Brak dzieci w grupie"
                : "Nie znaleziono dzieci pasujących do wyszukiwania."}
            </p>
          </div>
        )}
      </section>

      {selectedChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-xl dark:bg-zinc-900">
            <button
              onClick={() => setSelectedChild(null)}
              className="absolute right-3 sm:right-4 top-3 sm:top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-base sm:text-xl font-bold dark:bg-sky-900/30 shrink-0">
                {selectedChild.name[0]}{selectedChild.surname[0]}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {selectedChild.name} {selectedChild.surname}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500">{selectedChild.age} lat</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="rounded-lg sm:rounded-xl border border-zinc-200 p-3 sm:p-4 dark:border-zinc-700">
                <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 sm:mb-3">Zgody</h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Zgoda na zdjęcia</span>
                    {selectedChild.hasImageConsent ? (
                      <span className="text-xs sm:text-sm font-medium text-green-600">Tak</span>
                    ) : (
                      <span className="text-xs sm:text-sm font-medium text-red-500">Nie</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Zgoda RODO</span>
                    {selectedChild.hasDataConsent ? (
                      <span className="text-xs sm:text-sm font-medium text-green-600">Tak</span>
                    ) : (
                      <span className="text-xs sm:text-sm font-medium text-red-500">Nie</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedChild.allergies && selectedChild.allergies.length > 0 && (
                <div className="rounded-lg sm:rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4 dark:border-amber-800 dark:bg-amber-900/20">
                  <h3 className="text-sm sm:text-base font-semibold text-amber-800 dark:text-amber-300 mb-1.5 sm:mb-2">Alergie</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedChild.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-amber-200 px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium text-amber-800 dark:bg-amber-800 dark:text-amber-200"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedChild.specialNeeds && (
                <div className="rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <h3 className="text-sm sm:text-base font-semibold text-blue-800 dark:text-blue-300 mb-1.5 sm:mb-2">Specjalne potrzeby</h3>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">{selectedChild.specialNeeds}</p>
                </div>
              )}

              {selectedChild.parent && (
                <div className="rounded-lg sm:rounded-xl border border-zinc-200 p-3 sm:p-4 dark:border-zinc-700">
                  <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 sm:mb-3">Rodzic/Opiekun</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">{selectedChild.parent.name} {selectedChild.parent.surname}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate break-all">{selectedChild.parent.email}</span>
                    </div>
                    {selectedChild.parent.phone && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span>{selectedChild.parent.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button
              className="mt-4 sm:mt-6 w-full text-xs sm:text-sm"
              onClick={() => setSelectedChild(null)}
            >
              Zamknij
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
