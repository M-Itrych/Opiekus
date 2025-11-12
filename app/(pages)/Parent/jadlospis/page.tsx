'use client';

import { useState, useMemo } from 'react';
import Restaurant from '@mui/icons-material/Restaurant';
import FreeBreakfast from '@mui/icons-material/FreeBreakfast';
import BrunchDining from '@mui/icons-material/BrunchDining';
import LunchDining from '@mui/icons-material/LunchDining';
import BakeryDining from '@mui/icons-material/BakeryDining';
import LocalDining from '@mui/icons-material/LocalDining';

type MealKey = 'breakfast' | 'secondBreakfast' | 'lunch' | 'afternoonSnack' | 'dinner';

interface MealPlan {
  title: string;
  description: string;
  allergens?: string[];
}

const mealsOrder: Array<{ key: MealKey; label: string; Icon: typeof Restaurant }> = [
  { key: 'breakfast', label: 'Śniadanie', Icon: FreeBreakfast },
  { key: 'secondBreakfast', label: 'Drugie śniadanie', Icon: BrunchDining },
  { key: 'lunch', label: 'Obiad', Icon: LunchDining },
  { key: 'afternoonSnack', label: 'Podwieczorek', Icon: BakeryDining },
  { key: 'dinner', label: 'Kolacja', Icon: LocalDining },
];

const menuData: Record<string, Record<MealKey, MealPlan>> = {
  '2025-01-13': {
    breakfast: {
      title: 'Owsianka z malinami',
      description: 'Płatki owsiane na mleku, świeże maliny, plasterki banana, herbata owocowa',
    },
    secondBreakfast: {
      title: 'Kanapka z twarożkiem',
      description: 'Pełnoziarnista bułka z twarożkiem i rzodkiewką, ogórki, sok marchwiowo-jabłkowy',
    },
    lunch: {
      title: 'Zupa pomidorowa z ryżem',
      description: 'Domowa zupa pomidorowa na bulionie warzywnym z naturalnym ryżem',
      allergens: ['seler'],
    },
    afternoonSnack: {
      title: 'Jogurt naturalny z bakaliami',
      description: 'Jogurt naturalny z mieszanką bakalii i miodem',
      allergens: ['orzechy', 'mleko'],
    },
    dinner: {
      title: 'Lekkie risotto warzywne',
      description: 'Risotto z sezonowych warzyw z parmezanem',
      allergens: ['mleko'],
    },
  },
  '2025-01-14': {
    breakfast: {
      title: 'Placuszki bananowe',
      description: 'Placuszki bananowe z jogurtem naturalnym i miodem, herbata z cytryną',
      allergens: ['jaja', 'mleko'],
    },
    secondBreakfast: {
      title: 'Owocowy talerz',
      description: 'Plasterki jabłka, gruszki i winogron, woda z miętą',
    },
    lunch: {
      title: 'Krem z dyni',
      description: 'Kremowa zupa z dyni z pestkami słonecznika, grzanki pełnoziarniste',
      allergens: ['seler', 'gluten'],
    },
    afternoonSnack: {
      title: 'Ciasto marchewkowe',
      description: 'Wilgotne ciasto marchewkowe z polewą z serka, kompot truskawkowy',
      allergens: ['gluten', 'mleko', 'jaja'],
    },
    dinner: {
      title: 'Sałatka makaronowa',
      description: 'Makaron pełnoziarnisty, kurczak, kukurydza, groszek, jogurtowy dressing',
      allergens: ['gluten', 'mleko'],
    },
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

  const menuForDay = useMemo(() => {
    if (menuData[selectedDate]) return menuData[selectedDate];

    // Fallback menu if day not found
    return {
      breakfast: {
        title: 'Kanapka z pastą warzywną',
        description: 'Pełnoziarnisty chleb z pastą z ciecierzycy i warzywami, herbata z cytryną',
      },
      secondBreakfast: {
        title: 'Smoothie truskawkowe',
        description: 'Koktajl z truskawek, banana i jogurtu naturalnego',
        allergens: ['mleko'],
      },
      lunch: {
        title: 'Zupa jarzynowa',
        description: 'Lekka zupa z sezonowych warzyw z makaronem',
        allergens: ['seler', 'gluten'],
      },
      afternoonSnack: {
        title: 'Ryż z jabłkami',
        description: 'Ryż na mleku z cynamonem i duszonym jabłkiem',
        allergens: ['mleko'],
      },
      dinner: {
        title: 'Zapiekanka warzywna',
        description: 'Zapiekane warzywa z serem mozzarella i ziołami',
        allergens: ['mleko'],
      },
    } satisfies Record<MealKey, MealPlan>;
  }, [selectedDate]);

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
            Sprawdź, co przygotowaliśmy dla dzieci na dzisiejszy dzień.
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mealsOrder.map(({ key, label, Icon }) => {
          const meal = menuForDay[key];
          return (
            <div
              key={key}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  <Icon className="text-blue-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">{label}</h3>
              </div>
              <p className="text-gray-700 font-medium text-sm mb-1">{meal.title}</p>
              <p className="text-gray-600 text-xs leading-relaxed">{meal.description}</p>

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

