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
      <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          <span className="ml-2 text-zinc-600">Ładowanie danych grupy...</span>
        </div>
      </section>
    );
  }

  if (error) {
    // Handle "no assigned group" as an informational message, not an error
    if (error === "Brak przypisanej grupy") {
      return (
        <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <User className="h-8 w-8 text-zinc-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Brak przypisanej grupy
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
                Nie jesteś obecnie przypisany do żadnej grupy. Skontaktuj się z dyrektorem, aby zostać przypisanym do grupy.
              </p>
            </div>
            <Button
              onClick={fetchChildren}
              variant="outline"
              className="mt-2"
            >
              Odśwież
            </Button>
          </div>
        </section>
      );
    }

    // Other errors show as actual errors
    return (
      <section className="flex w-full flex-col gap-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-6 shadow-sm dark:border-red-800 dark:bg-red-900/20">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          <p className="text-center text-red-600 dark:text-red-400">{error}</p>
          <Button
            onClick={fetchChildren}
            variant="outline"
            className="mt-2"
          >
            Spróbuj ponownie
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {groupName}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-sky-600">{children.length}</span> dzieci w grupie
              </div>
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Lista dzieci w grupie z informacjami o zgodach i upoważnieniach.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Szukaj dziecka..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredChildren.map((child) => (
            <div
              key={child.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-semibold dark:bg-sky-900/30">
                    {child.name[0]}{child.surname[0]}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {child.name} {child.surname}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {child.age} lat
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  {child.hasImageConsent ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Camera className="h-4 w-4" />
                      <span>Zgoda na zdjęcia</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-500">
                      <CameraOff className="h-4 w-4" />
                      <span className="font-semibold">Brak zgody na zdjęcia</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {child.hasDataConsent ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Zgoda RODO</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>Brak zgody RODO</span>
                    </div>
                  )}
                </div>

                {child.allergies && child.allergies.length > 0 && (
                  <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      Alergie: {child.allergies.join(", ")}
                    </p>
                  </div>
                )}

                {child.specialNeeds && (
                  <div className="mt-1 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      {child.specialNeeds}
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => setSelectedChild(child)}
              >
                Szczegóły
              </Button>
            </div>
          ))}
        </div>

        {filteredChildren.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              {children.length === 0
                ? "Brak dzieci w grupie"
                : "Nie znaleziono dzieci pasujących do wyszukiwania."}
            </p>
          </div>
        )}
      </section>

      {/* Child Details Modal */}
      {selectedChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <button
              onClick={() => setSelectedChild(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xl font-bold dark:bg-sky-900/30">
                {selectedChild.name[0]}{selectedChild.surname[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedChild.name} {selectedChild.surname}
                </h2>
                <p className="text-zinc-500">{selectedChild.age} lat</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Zgody</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Zgoda na zdjęcia</span>
                    {selectedChild.hasImageConsent ? (
                      <span className="text-sm font-medium text-green-600">Tak</span>
                    ) : (
                      <span className="text-sm font-medium text-red-500">Nie</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Zgoda RODO</span>
                    {selectedChild.hasDataConsent ? (
                      <span className="text-sm font-medium text-green-600">Tak</span>
                    ) : (
                      <span className="text-sm font-medium text-red-500">Nie</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedChild.allergies && selectedChild.allergies.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Alergie</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedChild.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-800 dark:text-amber-200"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedChild.specialNeeds && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Specjalne potrzeby</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">{selectedChild.specialNeeds}</p>
                </div>
              )}

              {selectedChild.parent && (
                <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Rodzic/Opiekun</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <User className="h-4 w-4" />
                      <span>{selectedChild.parent.name} {selectedChild.parent.surname}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <Mail className="h-4 w-4" />
                      <span>{selectedChild.parent.email}</span>
                    </div>
                    {selectedChild.parent.phone && (
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Phone className="h-4 w-4" />
                        <span>{selectedChild.parent.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button
              className="mt-6 w-full"
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
