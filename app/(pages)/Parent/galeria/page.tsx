'use client';

import ParentLayout from '@/app/components/global/Layout/ParentLayout';
import { useMemo, useState } from 'react';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import EventIcon from '@mui/icons-material/Event';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

type EventKey = 'balKarnawalowy' | 'dzienZiemi' | 'wycieczkaZoo' | 'warsztatyWielkanocne';

interface GalleryItem {
  id: string;
  event: EventKey;
  month: string; 
  title: string;
}

const events: Record<EventKey, { label: string }> = {
  balKarnawalowy: {
    label: 'Bal karnawałowy',
  },
  dzienZiemi: {
    label: 'Dzień Ziemi',
  },
  wycieczkaZoo: {
    label: 'Wycieczka do ZOO',
  },
  warsztatyWielkanocne: {
    label: 'Warsztaty wielkanocne',
  },
};

const galleryData: GalleryItem[] = [
  {
    id: 'img-01',
    event: 'balKarnawalowy',
    month: '2025-01',
    title: 'Bal karnawałowy 2025',
  },
  {
    id: 'img-02',
    event: 'balKarnawalowy',
    month: '2025-01',
    title: 'Wspólne tańce',
  },
  {
    id: 'img-03',
    event: 'balKarnawalowy',
    month: '2025-01',
    title: 'Konkurs strojów',
  },
  {
    id: 'img-04',
    event: 'dzienZiemi',
    month: '2025-04',
    title: 'Sadzenie roślin',
  },
  {
    id: 'img-05',
    event: 'dzienZiemi',
    month: '2025-04',
    title: 'Warsztaty segregacji',
  },
  {
    id: 'img-06',
    event: 'dzienZiemi',
    month: '2025-04',
    title: 'Nasze roślinki',
  },
  {
    id: 'img-07',
    event: 'wycieczkaZoo',
    month: '2025-06',
    title: 'Spotkanie z żyrafą',
  },
  {
    id: 'img-08',
    event: 'wycieczkaZoo',
    month: '2025-06',
    title: 'Pokaz karmienia',
  },
  {
    id: 'img-09',
    event: 'wycieczkaZoo',
    month: '2025-06',
    title: 'Grupowe zdjęcie',
  },
  {
    id: 'img-10',
    event: 'warsztatyWielkanocne',
    month: '2025-03',
    title: 'Przygotowania świąteczne',
  },
  {
    id: 'img-11',
    event: 'warsztatyWielkanocne',
    month: '2025-03',
    title: 'Malowanie pisanek',
  },
  {
    id: 'img-12',
    event: 'warsztatyWielkanocne',
    month: '2025-03',
    title: 'Świąteczne dekoracje',
  },
];

const eventBackgrounds: Record<EventKey, string> = {
  balKarnawalowy:
    'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(236,72,153,0.85)), radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 55%)',
  dzienZiemi:
    'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(56,189,248,0.85)), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.3), transparent 55%)',
  wycieczkaZoo:
    'linear-gradient(135deg, rgba(250,204,21,0.9), rgba(249,115,22,0.85)), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.25), transparent 50%)',
  warsztatyWielkanocne:
    'linear-gradient(135deg, rgba(244,114,182,0.92), rgba(96,165,250,0.9)), radial-gradient(circle at 30% 70%, rgba(255,255,255,0.3), transparent 55%)',
};

const MONTH_LABELS = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

const uniqueMonths = Array.from(new Set(galleryData.map((item) => item.month))).sort();

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

export default function GaleriaPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    uniqueMonths[0] ?? new Date().toISOString().slice(0, 7)
  );

  const monthIndex = uniqueMonths.indexOf(selectedMonth);

  const filteredImages = useMemo(() => {
    return galleryData.filter((item) => item.month === selectedMonth);
  }, [selectedMonth]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (uniqueMonths.length === 0) return;
    const newIndex =
      direction === 'prev'
        ? Math.max(0, monthIndex - 1)
        : Math.min(uniqueMonths.length - 1, monthIndex + 1);

    setSelectedMonth(uniqueMonths[newIndex]);
  };

  return (
    <ParentLayout
      title="Galeria"
      description="Zobacz zdjęcia z wydarzeń w przedszkolu i wybierz interesujący Cię miesiąc oraz event."
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleMonthChange('prev')}
            className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm"
          >
            <NavigateBeforeIcon fontSize="small" />
            Poprzedni
          </button>
          <div className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 font-medium flex items-center gap-2 text-sm">
            <EventIcon fontSize="small" />
            {formatMonth(selectedMonth)}
          </div>
          <button
            onClick={() => handleMonthChange('next')}
            className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm"
          >
            Następny
            <NavigateNextIcon fontSize="small" />
          </button>
        </div>
      }
    >
      {filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-gray-200 rounded-xl text-center">
          <p className="text-lg font-semibold text-gray-700 mb-1">
            Brak zdjęć dla wybranych filtrów
          </p>
          <p className="text-sm text-gray-500">
            Wybierz inny miesiąc lub usuń filtr wydarzenia, aby zobaczyć więcej zdjęć.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.slice(0, 9).map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-4/3 overflow-hidden rounded-t-xl">
                <div
                  className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundImage: eventBackgrounds[item.event],
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm" />
                <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-semibold drop-shadow">{events[item.event].label}</p>
                  <p className="text-xs text-gray-200">{formatMonth(item.month)}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {events[item.event].label} • {formatMonth(item.month)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ParentLayout>
  );
}

