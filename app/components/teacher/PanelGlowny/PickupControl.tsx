"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Clock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  pickupPerson: string;
  pickupPersonId: string | null;
  relation: string;
  isAuthorized: boolean;
  notes: string | null;
  child: {
    id: string;
    name: string;
    surname: string;
  };
}

interface PickupControlProps {
  children: Array<{
    id: string;
    name: string;
    surname: string;
    pickupAuthorized: Array<{
      name: string;
      id: string;
      relation: string;
    }>;
  }>;
}

export default function PickupControl({ children }: PickupControlProps) {
  const [pickupRecords, setPickupRecords] = useState<Record<string, PickupRecord>>({});
  const [verificationCode, setVerificationCode] = useState("");
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchTodayPickups = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/pickup?pickupDate=${today}`);
      
      if (!res.ok) throw new Error('Failed to fetch pickups');
      
      const data: ApiPickupRecord[] = await res.json();
      
      const records: Record<string, PickupRecord> = {};
      data.forEach((record) => {
        records[record.childId] = {
          id: record.id,
          childId: record.childId,
          childName: `${record.child.name} ${record.child.surname}`,
          pickupTime: record.pickupTime,
          pickupDate: record.pickupDate,
          pickupPerson: record.pickupPerson,
          pickupPersonId: record.pickupPersonId || undefined,
          isAuthorized: record.isAuthorized,
          notes: record.notes || undefined,
        };
      });
      
      setPickupRecords(records);
    } catch (err) {
      console.error('Error fetching pickups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayPickups();
  }, [fetchTodayPickups]);

  const handlePickup = async (childId: string, personName: string, personId: string, relation: string) => {
    const child = children.find((c) => c.id === childId);
    const authorizedPerson = child?.pickupAuthorized.find((p) => p.id === personId);

    if (!authorizedPerson) {
      alert("Osoba nie jest upoważniona do odbioru tego dziecka!");
      return;
    }

    setSaving(childId);
    try {
      const now = new Date();
      const pickupDate = now.toISOString().split('T')[0];
      const pickupTime = now.toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' });

      const res = await fetch('/api/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          pickupDate,
          pickupTime,
          pickupPerson: personName,
          pickupPersonId: personId,
          relation,
          isAuthorized: true,
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
          pickupTime: savedRecord.pickupTime,
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
      alert('Wystąpił błąd podczas zapisywania odbioru');
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
        const pickupDate = now.toISOString().split('T')[0];
        const pickupTime = now.toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' });

        const res = await fetch('/api/pickup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId,
            pickupDate,
            pickupTime,
            pickupPerson: 'Osoba zweryfikowana kodem',
            pickupPersonId: verificationCode,
            relation: 'Zweryfikowana',
            isAuthorized: true,
            notes: `Weryfikacja kodem: ${verificationCode}`,
          }),
        });

        if (!res.ok) throw new Error('Failed to save pickup');
        
        const savedRecord: ApiPickupRecord = await res.json();

        setPickupRecords((prev) => ({
          ...prev,
          [childId]: {
            id: savedRecord.id,
            childId,
            childName: `${child.name} ${child.surname}`,
            pickupTime: savedRecord.pickupTime,
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
        alert('Wystąpił błąd podczas zapisywania odbioru');
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-sky-600" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Oczekujące na odbiór ({pendingPickups.length})
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {pendingPickups.map((child) => {
              const isSelected = selectedChild === child.id;
              const isSaving = saving === child.id;
              return (
                <div
                  key={child.id}
                  className={`flex flex-col gap-3 rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20"
                      : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {child.name} {child.surname}
                      </h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {child.pickupAuthorized.length} upoważnionych osób
                      </p>
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

                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Upoważnione osoby:
                        </p>
                        <div className="flex flex-col gap-2">
                          {child.pickupAuthorized.map((person) => (
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-sky-600" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Odebrane ({completedPickups.length})
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {completedPickups.map((child) => {
              const record = pickupRecords[child.id];
              return (
                <div
                  key={child.id}
                  className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-900/20"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-sky-600" />
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
