'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Restaurant from '@mui/icons-material/Restaurant';
import FreeBreakfast from '@mui/icons-material/FreeBreakfast';
import LunchDining from '@mui/icons-material/LunchDining';
import BakeryDining from '@mui/icons-material/BakeryDining';
import { Loader2, X, AlertTriangle, Leaf, CheckCircle } from 'lucide-react';

type MealKey = 'BREAKFAST' | 'LUNCH' | 'SNACK';

interface MealPlan {
  id: string;
  title: string;
  description: string;
  allergens?: string[];
  diet?: string;
  mealType: string;
}

interface ApiMealPlan {
  id: string;
  groupId: string | null;
  date: string;
  mealType: string;
  name: string;
  description: string | null;
  allergens: string[];
  diet?: string;
}

interface MealCancellation {
  id: string;
  childId: string;
  date: string;
  mealType: string;
  mealPrice: number;
  refunded: boolean;
}

interface Child {
  id: string;
  name: string;
  surname: string;
  diet: string;
  group?: {
    id: string;
    name: string;
  };
}

const mealsOrder: Array<{ key: MealKey; label: string; Icon: typeof Restaurant }> = [
  { key: 'BREAKFAST', label: 'Śniadanie', Icon: FreeBreakfast },
  { key: 'LUNCH', label: 'Obiad', Icon: LunchDining },
  { key: 'SNACK', label: 'Podwieczorek', Icon: BakeryDining },
];

const fallbackMenu: Record<MealKey, MealPlan> = {
  BREAKFAST: {
    id: '',
    title: 'Brak danych',
    description: 'Jadłospis dla tego dnia nie został jeszcze wprowadzony',
    mealType: 'BREAKFAST',
  },
  LUNCH: {
    id: '',
    title: 'Brak danych',
    description: 'Jadłospis dla tego dnia nie został jeszcze wprowadzony',
    mealType: 'LUNCH',
  },
  SNACK: {
    id: '',
    title: 'Brak danych',
    description: 'Jadłospis dla tego dnia nie został jeszcze wprowadzony',
    mealType: 'SNACK',
  },
};

const DIET_LABELS: Record<string, string> = {
  STANDARD: 'Standardowa',
  VEGETARIAN: 'Wegetariańska',
  VEGAN: 'Wegańska',
  GLUTEN_FREE: 'Bezglutenowa',
  LACTOSE_FREE: 'Bez laktozy',
  CUSTOM: 'Inna',
};

// Cancellation deadline - 8:00 AM
const CANCELLATION_DEADLINE_HOUR = 8;

function canCancelMeal(mealDate: string): boolean {
  const now = new Date();
  const deadline = new Date(mealDate);
  deadline.setHours(CANCELLATION_DEADLINE_HOUR, 0, 0, 0);
  return now < deadline;
}

const getTodayKey = () => new Date().toISOString().split('T')[0];

function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function JadlospisPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [mealPlans, setMealPlans] = useState<ApiMealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [cancellations, setCancellations] = useState<MealCancellation[]>([]);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [showCancellations, setShowCancellations] = useState(false);

  // Fetch children on mount
  useEffect(() => {
    async function fetchChildren() {
      try {
        const res = await fetch('/api/children');
        if (res.ok) {
          const data = await res.json();
          setChildren(data);
          if (data.length > 0) {
            setSelectedChildId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching children:', err);
      }
    }
    fetchChildren();
  }, []);

  const selectedChild = useMemo(() => {
    return children.find((c) => c.id === selectedChildId) || null;
  }, [children, selectedChildId]);

  const fetchMealPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedChild?.diet && selectedChild.diet !== 'STANDARD') {
        params.append('diet', selectedChild.diet);
      }
      
      const res = await fetch(`/api/meal-plans?${params}`);
      if (!res.ok) throw new Error('Błąd pobierania jadłospisu');
      
      const data: ApiMealPlan[] = await res.json();
      setMealPlans(data);
    } catch (err) {
      console.error(err);
      setError('Nie udało się pobrać jadłospisu');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedChild?.diet]);

  const fetchCancellations = useCallback(async () => {
    if (!selectedChildId) return;
    try {
      const res = await fetch(`/api/menu/cancellations?childId=${selectedChildId}`);
      if (res.ok) {
        const data = await res.json();
        setCancellations(data);
      }
    } catch (err) {
      console.error('Error fetching cancellations:', err);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  useEffect(() => {
    if (selectedChildId) {
      fetchCancellations();
    }
  }, [selectedChildId, fetchCancellations]);

  const isMealCancelled = useCallback((mealType: string) => {
    return cancellations.some(
      (c) => c.date.split('T')[0] === selectedDate && c.mealType === mealType
    );
  }, [cancellations, selectedDate]);

  const handleCancelMeal = async (mealType: string) => {
    if (!selectedChildId || !canCancelMeal(selectedDate)) return;
    
    setIsCancelling(mealType);
    try {
      const res = await fetch('/api/menu/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          date: selectedDate,
          mealType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Nie udało się anulować posiłku');
        return;
      }

      await fetchCancellations();
    } catch (err) {
      console.error('Error cancelling meal:', err);
      alert('Wystąpił błąd');
    } finally {
      setIsCancelling(null);
    }
  };

  const handleUndoCancellation = async (cancellationId: string) => {
    try {
      const res = await fetch(`/api/menu/cancellations?id=${cancellationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Nie udało się cofnąć anulowania');
        return;
      }

      await fetchCancellations();
    } catch (err) {
      console.error('Error undoing cancellation:', err);
      alert('Wystąpił błąd');
    }
  };

  const totalCancellationsValue = useMemo(() => {
    return cancellations
      .filter((c) => !c.refunded)
      .reduce((sum, c) => sum + c.mealPrice, 0);
  }, [cancellations]);

  const menuForDay = useMemo(() => {
    const menu: Record<MealKey, MealPlan> = { ...fallbackMenu };
    
    mealPlans.forEach((plan) => {
      const mealKey = plan.mealType.toUpperCase() as MealKey;
      if (mealsOrder.some((m) => m.key === mealKey)) {
        menu[mealKey] = {
          id: plan.id,
          title: plan.name,
          description: plan.description || '',
          allergens: plan.allergens.length > 0 ? plan.allergens : undefined,
          diet: plan.diet,
          mealType: plan.mealType,
        };
      }
    });

    return menu;
  }, [mealPlans]);

  const handleChangeDay = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleChangeDate = (value: string) => {
    if (!value) return;
    setSelectedDate(value);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Jadłospis</h1>
          <p className="text-gray-600 text-sm">
            Sprawdź, co przygotowaliśmy dla dzieci na wybrany dzień.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => handleChangeDay('prev')}
            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ← Wczoraj
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleChangeDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleChangeDay('next')}
            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Jutro →
          </button>
        </div>
      </div>

      {/* Child selector */}
      {children.length > 1 && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-5">
          <label className="text-sm text-gray-600 mb-2 block">Wybierz dziecko:</label>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedChildId === child.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {child.name} {child.surname}
                {child.diet !== 'STANDARD' && (
                  <Leaf className="inline-block ml-1 h-3 w-3" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Child diet info */}
      {selectedChild && selectedChild.diet !== 'STANDARD' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700">
              <strong>{selectedChild.name}</strong> ma przypisaną dietę: <strong>{DIET_LABELS[selectedChild.diet] || selectedChild.diet}</strong>
            </p>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Wyświetlane są posiłki odpowiednie dla tej diety.
          </p>
        </div>
      )}

      {/* Cancellations summary */}
      {cancellations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-700">
                  Anulowane posiłki: {cancellations.length}
                </p>
                {totalCancellationsValue > 0 && (
                  <p className="text-xs text-amber-600">
                    Do zwrotu: {totalCancellationsValue.toFixed(2)} zł
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowCancellations(!showCancellations)}
              className="text-xs text-amber-700 hover:text-amber-800 underline"
            >
              {showCancellations ? 'Ukryj' : 'Pokaż szczegóły'}
            </button>
          </div>
          
          {showCancellations && (
            <div className="mt-3 pt-3 border-t border-amber-200 space-y-2">
              {cancellations.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-sm bg-white rounded-lg p-2"
                >
                  <div>
                    <span className="text-gray-700">
                      {new Date(c.date).toLocaleDateString('pl-PL')} - {
                        c.mealType === 'BREAKFAST' ? 'Śniadanie' :
                        c.mealType === 'LUNCH' ? 'Obiad' : 'Podwieczorek'
                      }
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({c.mealPrice.toFixed(2)} zł)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.refunded ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Zwrócone
                      </span>
                    ) : canCancelMeal(c.date) ? (
                      <button
                        onClick={() => handleUndoCancellation(c.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Cofnij
                      </button>
                    ) : (
                      <span className="text-xs text-amber-600">Do zwrotu</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-5">
        <div className="flex items-center gap-3">
          <Restaurant className="text-blue-500" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Jadłospis dla dnia</p>
            <h2 className="text-lg font-semibold text-gray-800 capitalize">
              {formatDateLabel(selectedDate)}
            </h2>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Ładowanie jadłospisu...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={fetchMealPlans}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mealsOrder.map(({ key, label, Icon }) => {
            const meal = menuForDay[key];
            const hasData = meal.title !== 'Brak danych';
            const cancelled = isMealCancelled(key);
            const canCancel = hasData && canCancelMeal(selectedDate) && selectedChildId && !cancelled;
            
            return (
              <div
                key={key}
                className={`bg-white border rounded-xl p-4 shadow-sm transition-shadow ${
                  cancelled
                    ? 'border-red-200 bg-red-50/30'
                    : hasData
                    ? 'border-gray-200 hover:shadow-md'
                    : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      cancelled ? 'bg-red-100' : hasData ? 'bg-blue-50' : 'bg-gray-50'
                    }`}>
                      <Icon className={cancelled ? 'text-red-500' : hasData ? 'text-blue-500' : 'text-gray-400'} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">{label}</h3>
                  </div>
                  {cancelled && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full flex items-center gap-1">
                      <X className="h-3 w-3" /> Anulowane
                    </span>
                  )}
                  {meal.diet && meal.diet !== 'STANDARD' && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full flex items-center gap-1">
                      <Leaf className="h-3 w-3" /> {DIET_LABELS[meal.diet]}
                    </span>
                  )}
                </div>
                <p className={`font-medium text-sm mb-1 ${
                  cancelled ? 'text-gray-400 line-through' : hasData ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  {meal.title}
                </p>
                <p className={`text-xs leading-relaxed ${
                  cancelled ? 'text-gray-400' : hasData ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {meal.description}
                </p>

                {meal.allergens && meal.allergens.length > 0 && !cancelled && (
                  <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">
                      Alergeny:
                    </p>
                    <p className="text-xs text-red-500">{meal.allergens.join(', ')}</p>
                  </div>
                )}

                {canCancel && (
                  <button
                    onClick={() => handleCancelMeal(key)}
                    disabled={isCancelling === key}
                    className="mt-3 w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isCancelling === key ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Anulowanie...
                      </span>
                    ) : (
                      'Anuluj posiłek'
                    )}
                  </button>
                )}

                {cancelled && canCancelMeal(selectedDate) && (
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Możesz cofnąć anulowanie w sekcji powyżej
                  </p>
                )}

                {hasData && !canCancelMeal(selectedDate) && !cancelled && (
                  <p className="mt-3 text-xs text-gray-400 text-center">
                    Anulowanie możliwe do godz. {CANCELLATION_DEADLINE_HOUR}:00
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-blue-800 font-semibold mb-1">Informacje dodatkowe</h3>
        <ul className="text-blue-700 text-xs space-y-1 list-disc list-inside">
          <li>Jadłospis może ulec zmianie w zależności od dostępności produktów.</li>
          <li>
            W przypadku alergii prosimy o kontakt z administracją przedszkola celem ustalenia
            indywidualnego menu.
          </li>
          <li>Napojem do posiłków jest woda, a do śniadań dodatkowo herbata lub sok.</li>
        </ul>
      </div>
    </div>
  );
}
