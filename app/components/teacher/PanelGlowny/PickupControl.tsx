"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Clock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/app/components/global/Modal/ModalContext";

interface PickupRecord {
  id: string;
  childId: string;
  childName: string;
  pickupTime: string;
  pickupDate: string;
  pickupPerson: string;
  pickupPersonId?: string;
  isAuthorized: boolean;
  notes?: string;
}

interface ApiPickupRecord {
  id: string;
  childId: string;
  pickupDate: string;
  pickupTime: string;
  authorizedPerson: string;
  verificationMethod: string | null;
  notes: string | null;
  child: {
    id: string;
    name: string;
    surname: string;
  };
}

interface AuthorizedPerson {
  id: string;
  name: string;
  surname: string;
  relation: string;
  phone: string | null;
  idNumber: string | null;
}

interface Child {
  id: string;
  name: string;
  surname: string;
  parent?: {
    id: string;
    name: string;
    surname: string;
  };
}

export default function PickupControl() {
  const { showModal } = useModal();
  const [children, setChildren] = useState<Child[]>([]);
  const [pickupRecords, setPickupRecords] = useState<Record<string, PickupRecord>>({});
  const [authorizedPersonsMap, setAuthorizedPersonsMap] = useState<Record<string, AuthorizedPerson[]>>({});
  const [verificationCode, setVerificationCode] = useState("");
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    try {
      const res = await fetch("/api/groups/children");
      if (!res.ok) throw new Error("Failed to fetch children");
      const data = await res.json();
      setChildren(data);
      return data;
    } catch (err) {
      console.error("Error fetching children:", err);
      return [];
    }
  }, []);

  const fetchAuthorizedPersonsForChild = useCallback(async (childId: string) => {
    try {
      const res = await fetch(`/api/children/${childId}/authorized-persons`);
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Error fetching authorized persons:", err);
      return [];
    }
  }, []);

  const fetchTodayPickups = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/pickup?date=${today}`);

      if (!res.ok) throw new Error('Failed to fetch pickups');

      const data: ApiPickupRecord[] = await res.json();

      const records: Record<string, PickupRecord> = {};
      data.forEach((record) => {
        records[record.childId] = {
          id: record.id,
          childId: record.childId,
          childName: `${record.child.name} ${record.child.surname}`,
          pickupTime: new Date(record.pickupTime).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
          pickupDate: record.pickupDate,
          pickupPerson: record.authorizedPerson,
          pickupPersonId: record.verificationMethod || undefined,
          isAuthorized: true,
          notes: record.notes || undefined,
        };
      });

      setPickupRecords(records);
    } catch (err) {
      console.error('Error fetching pickups:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [childrenData] = await Promise.all([fetchChildren(), fetchTodayPickups()]);

      const personsMap: Record<string, AuthorizedPerson[]> = {};
      await Promise.all(
        childrenData.map(async (child: Child) => {
          const persons = await fetchAuthorizedPersonsForChild(child.id);
          personsMap[child.id] = persons;
        })
      );
      setAuthorizedPersonsMap(personsMap);

      setLoading(false);
    };
    loadData();
  }, [fetchChildren, fetchTodayPickups, fetchAuthorizedPersonsForChild]);

  const getAuthorizedPersons = (child: Child): { id: string; name: string; relation: string }[] => {
    const persons: { id: string; name: string; relation: string }[] = [];

    if (child.parent) {
      persons.push({
        id: child.parent.id,
        name: `${child.parent.name} ${child.parent.surname}`,
        relation: "Rodzic",
      });
    }

    const dbPersons = authorizedPersonsMap[child.id] || [];
    dbPersons.forEach((person) => {
      persons.push({
        id: person.id,
        name: `${person.name} ${person.surname}`,
        relation: person.relation,
      });
    });

    return persons;
  };

  const handlePickup = async (childId: string, personName: string, personId: string, relation: string) => {
    setSaving(childId);
    try {
      const child = children.find((c) => c.id === childId);
      const now = new Date();
      const pickupDate = now.toISOString();
      const pickupTime = now.toISOString();

      const res = await fetch('/api/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          pickupDate,
          pickupTime,
          authorizedPerson: personName,
          verificationMethod: `${relation} - ${personId}`,
        }),
      });

      if (!res.ok) throw new Error('Failed to save pickup');

      const savedRecord: ApiPickupRecord = await res.json();

      setPickupRecords((prev) => ({
        ...prev,
        [childId]: {
          id: savedRecord.id,
          childId,
          childName: `${child?.name} ${child?.surname}`,
          pickupTime: new Date(savedRecord.pickupTime).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
          pickupDate: savedRecord.pickupDate,
          pickupPerson: personName,
          pickupPersonId: personId,
          isAuthorized: true,
        },
      }));

      setSelectedChild(null);
      setVerificationCode("");
    } catch (err) {
      console.error('Error saving pickup:', err);
      showModal('error', 'Wystąpił błąd podczas zapisywania odbioru');
    } finally {
      setSaving(null);
    }
  };

  const handleVerification = async (childId: string) => {
    const child = children.find((c) => c.id === childId);
    if (child) {
      setSaving(childId);
      try {
        const now = new Date();
        const pickupDate = now.toISOString();
        const pickupTime = now.toISOString();

        const res = await fetch('/api/pickup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId,
            pickupDate,
            pickupTime,
            authorizedPerson: 'Osoba zweryfikowana kodem',
            verificationMethod: `Kod: ${verificationCode}`,
            notes: `Weryfikacja kodem: ${verificationCode}`,
            verificationCode: verificationCode.trim(),
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to verify code');
        }

        const savedRecord: ApiPickupRecord = await res.json();

        setPickupRecords((prev) => ({
          ...prev,
          [childId]: {
            id: savedRecord.id,
            childId,
            childName: `${child.name} ${child.surname}`,
            pickupTime: new Date(savedRecord.pickupTime).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
            pickupDate: savedRecord.pickupDate,
            pickupPerson: 'Osoba zweryfikowana kodem',
            pickupPersonId: verificationCode,
            isAuthorized: true,
            notes: `Weryfikacja kodem: ${verificationCode}`,
          },
        }));

        setSelectedChild(null);
        setVerificationCode("");
      } catch (err) {
        console.error('Error saving pickup:', err);
        showModal('error', 'Wystąpił błąd podczas zapisywania odbioru');
      } finally {
        setSaving(null);
      }
    }
  };

  const pendingPickups = children.filter(
    (child) => !pickupRecords[child.id]
  );
  const completedPickups = children.filter(
    (child) => pickupRecords[child.id]
  );

  if (loading) {
    return (
      <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          <span className="ml-2 text-zinc-600">Ładowanie danych odbiorów...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Kontrola odbioru dzieci
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Weryfikacja tożsamości i odbiór dzieci przez upoważnione osoby.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Oczekujące na odbiór */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <Clock className="h-5 w-5 text-sky-600" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Oczekujące na odbiór ({pendingPickups.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingPickups.map((child) => {
              const isSelected = selectedChild === child.id;
              const isSaving = saving === child.id;
              const authorizedPersons = getAuthorizedPersons(child);

              return (
                <div
                  key={child.id}
                  className={`flex flex-col gap-3 rounded-xl border p-4 transition-all ${isSelected
                    ? "border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20"
                    : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-semibold dark:bg-sky-900/30">
                        {child.name[0]}{child.surname[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {child.name} {child.surname}
                        </h4>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {authorizedPersons.length} upoważnionych osób
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedChild(isSelected ? null : child.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Zapisywanie...
                        </>
                      ) : isSelected ? (
                        "Anuluj"
                      ) : (
                        "Odbierz"
                      )}
                    </Button>
                  </div>

                  {isSelected && (
                    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Kod weryfikacyjny / ID osoby
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Wprowadź kod..."
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => handleVerification(child.id)}
                            disabled={!verificationCode || isSaving}
                          >
                            {isSaving ? 'Zapisywanie...' : 'Zweryfikuj'}
                          </Button>
                        </div>
                      </div>

                      {authorizedPersons.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Upoważnione osoby:
                          </p>
                          <div className="flex flex-col gap-2">
                            {authorizedPersons.map((person) => (
                              <Button
                                key={person.id}
                                variant="outline"
                                className="flex items-center justify-between"
                                onClick={() =>
                                  handlePickup(child.id, person.name, person.id, person.relation)
                                }
                                disabled={isSaving}
                              >
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{person.name}</span>
                                  <span className="text-xs text-zinc-500">
                                    ({person.relation})
                                  </span>
                                </div>
                                <CheckCircle className="h-4 w-4 text-sky-600" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {pendingPickups.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-zinc-500 dark:text-zinc-400">
                Wszystkie dzieci zostały odebrane
              </p>
            </div>
          )}
        </div>

        {/* Odebrane */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Odebrane ({completedPickups.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedPickups.map((child) => {
              const record = pickupRecords[child.id];
              return (
                <div
                  key={child.id}
                  className="flex flex-col gap-2 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {child.name} {child.surname}
                    </h4>
                  </div>
                  <div className="ml-7 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <p>
                      Odebrane przez: <span className="font-medium">{record.pickupPerson}</span>
                    </p>
                    <p>
                      Godzina: <span className="font-medium">{record.pickupTime}</span>
                    </p>
                    {record.notes && (
                      <p className="text-xs text-zinc-500">
                        Uwagi: {record.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {completedPickups.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-zinc-500 dark:text-zinc-400">
                Brak odebranych dzieci
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
