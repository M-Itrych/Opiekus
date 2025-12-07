'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Restaurant from '@mui/icons-material/Restaurant';
import FreeBreakfast from '@mui/icons-material/FreeBreakfast';
import BrunchDining from '@mui/icons-material/BrunchDining';
import LunchDining from '@mui/icons-material/LunchDining';
import BakeryDining from '@mui/icons-material/BakeryDining';
import LocalDining from '@mui/icons-material/LocalDining';
import { Loader2 } from 'lucide-react';

type MealKey = 'breakfast' | 'secondBreakfast' | 'lunch' | 'afternoonSnack' | 'dinner';

interface MealPlan {
  title: string;
  description: string;
  allergens?: string[];
}

interface ApiMealPlan {
  id: string;
  groupId: string | null;
  date: string;
  mealType: string;
  name: string;
  description: string | null;
  allergens: string[];
}

const mealsOrder: Array<{ key: MealKey; label: string; mealType: string; Icon: typeof Restaurant }> = [
  { key: 'breakfast', label: 'Śniadanie', mealType: 'breakfast', Icon: FreeBreakfast },
  { key: 'secondBreakfast', label: 'Drugie śniadanie', mealType: 'secondBreakfast', Icon: BrunchDining },
  { key: 'lunch', label: 'Obiad', mealType: 'lunch', Icon: LunchDining },
  { key: 'afternoonSnack', label: 'Podwieczorek', mealType: 'afternoonSnack', Icon: BakeryDining },
  { key: 'dinner', label: 'Kolacja', mealType: 'dinner', Icon: LocalDining },
];

const fallbackMenu: Record<MealKey, MealPlan> = {
  breakfast: {
    title: 'Brak danych',
    description: 'Jadłospis dla tego dnia nie został jeszcze wprowadzony',
  },
  secondBreakfast: {
    title: 'Brak danych',
    description: 'Jadłospis dla tego dnia nie został jeszcze wprowadzony',
  },
  lunch: {
    title: 'Brak danych',
    description: 'Jadłospis dla tego dnia nie został jeszcze wprowadzony',
  },
  afternoonSnack: {
    title: 'Brak danych',
    description: 'Jadłospis dla tego dnia nie został jeszcze wprowadzony',
  },
  dinner: {
    title: 'Brak danych',
    description: 'Jadłospis dla tego dnia nie został jeszcze wprowadzony',
  },
};

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

  const fetchMealPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/meal-plans?date=${selectedDate}`);
      if (!res.ok) throw new Error('Błąd pobierania jadłospisu');
      
      const data: ApiMealPlan[] = await res.json();
      setMealPlans(data);
    } catch (err) {
      console.error(err);
      setError('Nie udało się pobrać jadłospisu');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  const menuForDay = useMemo(() => {
    const menu: Record<MealKey, MealPlan> = { ...fallbackMenu };
    
    mealPlans.forEach((plan) => {
      const mealKey = plan.mealType.toLowerCase() as MealKey;
      if (mealsOrder.some((m) => m.key === mealKey)) {
        menu[mealKey] = {
          title: plan.name,
          description: plan.description || '',
          allergens: plan.allergens.length > 0 ? plan.allergens : undefined,
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
            
            return (
              <div
                key={key}
                className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${
                  hasData ? 'border-gray-200' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className={`p-2 rounded-lg shrink-0 ${hasData ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <Icon className={hasData ? 'text-blue-500' : 'text-gray-400'} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">{label}</h3>
                </div>
                <p className={`font-medium text-sm mb-1 ${hasData ? 'text-gray-700' : 'text-gray-400'}`}>
                  {meal.title}
                </p>
                <p className={`text-xs leading-relaxed ${hasData ? 'text-gray-600' : 'text-gray-400'}`}>
                  {meal.description}
                </p>

                {meal.allergens && meal.allergens.length > 0 && (
                  <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">
                      Alergeny:
                    </p>
                    <p className="text-xs text-red-500">{meal.allergens.join(', ')}</p>
                  </div>
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
