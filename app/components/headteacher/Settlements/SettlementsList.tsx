"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  Coffee,
  Utensils,
  Cookie,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Receipt,
  DollarSign,
} from "lucide-react";

interface Cancellation {
  id: string;
  date: string;
  mealType: string;
  mealPrice: number;
  refunded: boolean;
}

interface ChildSettlement {
  childId: string;
  childName: string;
  childSurname: string;
  groupId: string | null;
  groupName: string | null;
  cancellations: Cancellation[];
  totalUnrefunded: number;
  totalRefunded: number;
}

interface SettlementsSummary {
  totalChildren: number;
  totalCancellations: number;
  grandTotalUnrefunded: number;
  grandTotalRefunded: number;
}

interface Group {
  id: string;
  name: string;
}

const MEAL_ICONS: Record<string, React.ElementType> = {
  BREAKFAST: Coffee,
  LUNCH: Utensils,
  SNACK: Cookie,
};

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Śniadanie",
  LUNCH: "Obiad",
  SNACK: "Podwieczorek",
};

export default function SettlementsList() {
  const [settlements, setSettlements] = useState<ChildSettlement[]>([]);
  const [summary, setSummary] = useState<SettlementsSummary | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [onlyUnrefunded, setOnlyUnrefunded] = useState(true);

  const [expandedChildren, setExpandedChildren] = useState<Set<string>>(new Set());
  const [selectedCancellations, setSelectedCancellations] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [selectedGroupId, startDate, endDate, onlyUnrefunded]);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  const fetchSettlements = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedGroupId !== "all") params.append("groupId", selectedGroupId);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (onlyUnrefunded) params.append("onlyUnrefunded", "true");

      const response = await fetch(`/api/settlements?${params}`);
      if (!response.ok) throw new Error("Nie udało się pobrać rozliczeń");

      const data = await response.json();
      setSettlements(data.settlements);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChildExpanded = (childId: string) => {
    setExpandedChildren((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(childId)) {
        newSet.delete(childId);
      } else {
        newSet.add(childId);
      }
      return newSet;
    });
  };

  const toggleCancellationSelected = (cancellationId: string) => {
    setSelectedCancellations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cancellationId)) {
        newSet.delete(cancellationId);
      } else {
        newSet.add(cancellationId);
      }
      return newSet;
    });
  };

  const selectAllUnrefunded = () => {
    const allUnrefunded = settlements.flatMap((s) =>
      s.cancellations.filter((c) => !c.refunded).map((c) => c.id)
    );
    setSelectedCancellations(new Set(allUnrefunded));
  };

  const clearSelection = () => {
    setSelectedCancellations(new Set());
  };

  const handleMarkAsRefunded = async () => {
    if (selectedCancellations.size === 0) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancellationIds: Array.from(selectedCancellations),
          action: "refund",
        }),
      });

      if (!response.ok) throw new Error("Nie udało się oznaczyć jako zwrócone");

      await fetchSettlements();
      setSelectedCancellations(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateRefunds = async () => {
    if (selectedCancellations.size === 0) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancellationIds: Array.from(selectedCancellations),
          action: "generate_payment",
        }),
      });

      if (!response.ok) throw new Error("Nie udało się wygenerować zwrotów");

      const data = await response.json();
      alert(`Utworzono ${data.payments?.length || 0} zwrotów`);

      await fetchSettlements();
      setSelectedCancellations(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTotal = settlements
    .flatMap((s) => s.cancellations)
    .filter((c) => selectedCancellations.has(c.id))
    .reduce((sum, c) => sum + c.mealPrice, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div className="grid gap-2">
          <Label>Grupa</Label>
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="Wszystkie grupy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie grupy</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Od daty</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>Do daty</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyUnrefunded}
              onChange={(e) => setOnlyUnrefunded(e.target.checked)}
              className="rounded border-zinc-300"
            />
            <span className="text-sm">Tylko niezwrócone</span>
          </label>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-500">Dzieci z anulowaniami</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {summary.totalChildren}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-500">Anulowane posiłki</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {summary.totalCancellations}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
            <p className="text-sm text-amber-600">Do zwrotu</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {summary.grandTotalUnrefunded.toFixed(2)} zł
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20">
            <p className="text-sm text-green-600">Zwrócone</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {summary.grandTotalRefunded.toFixed(2)} zł
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {selectedCancellations.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-700">
          <div className="flex-1">
            <p className="text-sm font-medium text-sky-700 dark:text-sky-300">
              Zaznaczono: {selectedCancellations.size} anulowań ({selectedTotal.toFixed(2)} zł)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Odznacz wszystkie
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsRefunded}
            disabled={isProcessing}
            className="text-green-600 hover:text-green-700"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Oznacz jako zwrócone
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateRefunds}
            disabled={isProcessing}
            className="bg-sky-600 hover:bg-sky-500 text-white"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Receipt className="h-4 w-4 mr-2" />}
            Generuj zwroty
          </Button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </div>
      ) : settlements.length === 0 ? (
        <div className="text-center text-zinc-500 py-10">
          Brak anulowanych posiłków w wybranym okresie.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-zinc-500">
              {settlements.length} dzieci z anulowanymi posiłkami
            </p>
            <Button variant="outline" size="sm" onClick={selectAllUnrefunded}>
              Zaznacz wszystkie niezwrócone
            </Button>
          </div>

          {settlements.map((settlement) => {
            const isExpanded = expandedChildren.has(settlement.childId);
            const unrefundedCount = settlement.cancellations.filter((c) => !c.refunded).length;

            return (
              <div
                key={settlement.childId}
                className="border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  onClick={() => toggleChildExpanded(settlement.childId)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-zinc-400" />
                      )}
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {settlement.childSurname} {settlement.childName}
                      </span>
                    </div>
                    {settlement.groupName && (
                      <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-400">
                        {settlement.groupName}
                      </span>
                    )}
                    {unrefundedCount > 0 && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                        <AlertCircle className="h-3 w-3" />
                        {unrefundedCount} do zwrotu
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {settlement.totalUnrefunded > 0 && (
                        <p className="text-sm font-medium text-amber-600">
                          {settlement.totalUnrefunded.toFixed(2)} zł do zwrotu
                        </p>
                      )}
                      {settlement.totalRefunded > 0 && (
                        <p className="text-xs text-green-600">
                          {settlement.totalRefunded.toFixed(2)} zł zwrócone
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-200 dark:border-zinc-700 p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-zinc-500">
                          <th className="text-left pb-2 w-8"></th>
                          <th className="text-left pb-2">Data</th>
                          <th className="text-left pb-2">Posiłek</th>
                          <th className="text-right pb-2">Wartość</th>
                          <th className="text-right pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settlement.cancellations.map((c) => {
                          const MealIcon = MEAL_ICONS[c.mealType] || Utensils;
                          return (
                            <tr
                              key={c.id}
                              className="border-t border-zinc-100 dark:border-zinc-800"
                            >
                              <td className="py-2">
                                {!c.refunded && (
                                  <input
                                    type="checkbox"
                                    checked={selectedCancellations.has(c.id)}
                                    onChange={() => toggleCancellationSelected(c.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="rounded border-zinc-300"
                                  />
                                )}
                              </td>
                              <td className="py-2">
                                {format(new Date(c.date), "d MMM yyyy", { locale: pl })}
                              </td>
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  <MealIcon className="h-4 w-4 text-zinc-400" />
                                  {MEAL_LABELS[c.mealType] || c.mealType}
                                </div>
                              </td>
                              <td className="py-2 text-right font-medium">
                                {c.mealPrice.toFixed(2)} zł
                              </td>
                              <td className="py-2 text-right">
                                {c.refunded ? (
                                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                    <CheckCircle className="h-3 w-3" />
                                    Zwrócone
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                    <DollarSign className="h-3 w-3" />
                                    Do zwrotu
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

