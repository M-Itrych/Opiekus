'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Restaurant from '@mui/icons-material/Restaurant';
import FreeBreakfast from '@mui/icons-material/FreeBreakfast';
import BrunchDining from '@mui/icons-material/BrunchDining';
import LunchDining from '@mui/icons-material/LunchDining';
import BakeryDining from '@mui/icons-material/BakeryDining';
import LocalDining from '@mui/icons-material/LocalDining';
import ChildCare from '@mui/icons-material/ChildCare';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import PaymentIcon from '@mui/icons-material/Payment';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import { QrCodeIcon } from 'lucide-react';

type MealKey = 'breakfast' | 'secondBreakfast' | 'lunch' | 'afternoonSnack' | 'dinner';

interface MealPlan {
  title: string;
  description: string;
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
      description: 'Pełnoziarnista bułka z twarożkiem i rzodkiewką, sok marchwiowo-jabłkowy',
    },
    lunch: {
      title: 'Zupa pomidorowa z ryżem',
      description: 'Domowa zupa pomidorowa z ryżem i świeżą pietruszką',
    },
    afternoonSnack: {
      title: 'Jogurt naturalny z bakaliami',
      description: 'Jogurt naturalny z mieszanką bakalii i miodem',
    },
    dinner: {
      title: 'Risotto warzywne',
      description: 'Risotto z warzywami sezonowymi i parmezanem',
    },
  },
  '2025-01-14': {
    breakfast: {
      title: 'Placuszki bananowe',
      description: 'Placuszki z banana z jogurtem naturalnym i syropem klonowym',
    },
    secondBreakfast: {
      title: 'Owocowy talerz',
      description: 'Zestaw świeżych owoców sezonowych',
    },
    lunch: {
      title: 'Krem z dyni',
      description: 'Zupa krem z dyni z grzankami pełnoziarnistymi',
    },
    afternoonSnack: {
      title: 'Ciasto marchewkowe',
      description: 'Wilgotne ciasto marchewkowe z polewą z serka',
    },
    dinner: {
      title: 'Sałatka makaronowa',
      description: 'Makaron pełnoziarnisty, kurczak, kukurydza, jogurtowy dressing',
    },
  },
};

const fallbackMenu: Record<MealKey, MealPlan> = {
  breakfast: {
    title: 'Kanapka z pastą warzywną',
    description: 'Pełnoziarnisty chleb z pastą z ciecierzycy i warzywami',
  },
  secondBreakfast: {
    title: 'Smoothie truskawkowe',
    description: 'Koktajl z truskawek, banana i jogurtu naturalnego',
  },
  lunch: {
    title: 'Zupa jarzynowa',
    description: 'Zupa z sezonowych warzyw z makaronem',
  },
  afternoonSnack: {
    title: 'Ryż z jabłkami',
    description: 'Ryż na mleku z cynamonem i duszonym jabłkiem',
  },
  dinner: {
    title: 'Zapiekanka warzywna',
    description: 'Warzywa zapiekane z serem mozzarella i ziołami',
  },
};

interface Message {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  date: string;
  isRead?: boolean;
}

const inboxSeed: Message[] = [
  {
    id: 'msg-001',
    sender: 'Anna Kowalczyk',
    subject: 'Podsumowanie tygodnia',
    preview: 'Szanowni Państwo, przesyłam krótkie podsumowanie zajęć z minionego tygodnia...',
    date: '2025-01-18T15:40:00',
    isRead: false,
  },
  {
    id: 'msg-002',
    sender: 'Administracja przedszkola',
    subject: 'Informacja o płatnościach',
    preview: 'Przypominamy o terminie płatności za czesne za miesiąc styczeń...',
    date: '2025-01-16T09:15:00',
    isRead: true,
  },
  {
    id: 'msg-003',
    sender: 'Marek Nowak',
    subject: 'Materiały z języka angielskiego',
    preview: 'Przesyłam materiały powtórkowe z bieżącego modułu...',
    date: '2025-01-12T17:55:00',
    isRead: true,
  },
];

type PaymentStatus = 'pending' | 'overdue';

interface UpcomingPaymentSummary {
  id: string;
  month: string;
  dueDate: string;
  status: PaymentStatus;
  total: number;
}

const upcomingSummary: UpcomingPaymentSummary[] = [
  {
    id: 'up-2025-02',
    month: 'Luty 2025',
    dueDate: '2025-02-10',
    total: 650,
    status: 'pending',
  },
  {
    id: 'up-2025-03',
    month: 'Marzec 2025',
    dueDate: '2025-03-10',
    total: 640,
    status: 'pending',
  },
  {
    id: 'up-2025-01',
    month: 'Styczeń 2025',
    dueDate: '2025-01-10',
    total: 620,
    status: 'overdue',
  },
];

const childProfile = {
  imie: 'Anna',
  nazwisko: 'Kowalska',
  grupa: 'Motylki',
  rodzice: ['Agnieszka Kowalska', 'Piotr Kowalski'],
};

const getTodayKey = () => new Date().toISOString().split('T')[0];

export default function ParentPage() {
  const router = useRouter();
  const todayKey = getTodayKey();
  const todaysMenu = menuData[todayKey] ?? fallbackMenu;
  const [attendanceStatus, setAttendanceStatus] = useState<'none' | 'arrived' | 'pickedUp'>('none');
  const [arrivalTime, setArrivalTime] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState<Date | null>(null);
  const [kodOdbioru, setKodOdbioru] = useState<string>('');

  const { unreadCount, recentMessages } = useMemo(() => {
    const sorted = [...inboxSeed].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return {
      unreadCount: inboxSeed.filter((msg) => !msg.isRead).length,
      recentMessages: sorted.slice(0, 3),
    };
  }, []);

  const { outstandingTotal, overdueTotal, nearestDue } = useMemo(() => {
    const total = upcomingSummary.reduce((sum, item) => sum + item.total, 0);
    const overdue = upcomingSummary
      .filter((item) => item.status === 'overdue')
      .reduce((sum, item) => sum + item.total, 0);
    const nearest = upcomingSummary
      .slice()
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    return { outstandingTotal: total, overdueTotal: overdue, nearestDue: nearest };
  }, []);

  const todayLabel = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  const handleConfirmArrival = () => {
    if (attendanceStatus === 'pickedUp') {
      setPickupTime(null);
    }
    setAttendanceStatus('arrived');
    setArrivalTime(new Date());
  };

  const handleConfirmPickup = () => {
    if (attendanceStatus !== 'arrived') return;
    setAttendanceStatus('pickedUp');
    setPickupTime(new Date());
  };

  const handleResetAttendance = () => {
    setAttendanceStatus('none');
    setArrivalTime(null);
    setPickupTime(null);
  };

  const formatTime = (date: Date | null) =>
    date
      ? date.toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;
    const odswiezKodOdbioru = () => {
      const randomCode = Math.floor(10000 + Math.random() * 90000).toString();
      setKodOdbioru(randomCode);
    };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel rodzica</h1>
          <p className="text-sm text-gray-600">
            Szybki przegląd najważniejszych informacji z dzisiejszego dnia.
          </p>

        </div>
        <div className='flex flex-col items-center gap-2  '>
          <button className='inline-flex items-center gap-2 rounded-lg border cursor-pointer border-sky-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors' onClick={() => {
            odswiezKodOdbioru();
          }}>
            <RefreshIcon fontSize="small" />
            Odśwież kod odbioru
          </button>
          <div className='flex items-center gap-2'>
            <QrCodeIcon fontSize="small" />
            <p className='text-sm text-gray-600 gap-2'>Kod odbioru: <span className='font-semibold text-gray-800 gap-2 text-xl font-bold'>{kodOdbioru ? kodOdbioru : 'Brak kodu odbioru'}</span></p>
          </div>
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-2xl">
            <ChildCare className="text-blue-500" fontSize="large" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              Dane dziecka
            </p>
            <h2 className="text-xl font-bold text-gray-800">
              {childProfile.imie} {childProfile.nazwisko}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Grupa: <span className="font-semibold text-gray-800">{childProfile.grupa}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Rodzice / opiekunowie: {childProfile.rodzice.join(', ')}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/Parent/dziecko')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Zobacz profil
          <ArrowForwardIosIcon fontSize="inherit" />
        </button>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Obecność dziecka</h2>
          <p className="text-sm text-gray-600">
            Potwierdź przybycie dziecka do placówki oraz jego odbiór w ciągu dnia.
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Przybycie</p>
              <p className="text-sm font-medium text-gray-800">
                {attendanceStatus === 'arrived' || attendanceStatus === 'pickedUp'
                  ? `Potwierdzone o ${formatTime(arrivalTime)}`
                  : 'Oczekuje na potwierdzenie'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Odbiór</p>
              <p className="text-sm font-medium text-gray-800">
                {attendanceStatus === 'pickedUp'
                  ? `Potwierdzono odbiór o ${formatTime(pickupTime)}`
                  : 'Dziecko w placówce'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleConfirmArrival}
            disabled={attendanceStatus === 'arrived' || attendanceStatus === 'pickedUp'}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            <LoginIcon fontSize="small" />
            {attendanceStatus === 'arrived' || attendanceStatus === 'pickedUp'
              ? 'Przybycie potwierdzone'
              : 'Potwierdź przybycie'}
          </button>
          <button
            onClick={handleConfirmPickup}
            disabled={attendanceStatus !== 'arrived'}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed"
          >
            <LogoutIcon fontSize="small" />
            {attendanceStatus === 'pickedUp' ? 'Odbiór potwierdzony' : 'Potwierdź odbiór'}
          </button>
          <button
            onClick={handleResetAttendance}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshIcon fontSize="small" />
            Resetuj
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col">
          <header className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Restaurant className="text-blue-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Dzisiejszy jadłospis</h2>
                <p className="text-xs uppercase tracking-wide text-gray-500">{todayLabel}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/Parent/jadlospis')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Zobacz całość
              <ArrowForwardIosIcon fontSize="inherit" />
            </button>
          </header>
          <ul className="space-y-3 text-sm text-gray-700">
            {mealsOrder.map(({ key, label, Icon }) => {
              const meal = todaysMenu[key];
              return (
                <li key={key} className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                    <Icon className="text-blue-500" fontSize="small" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{label}</p>
                    <p className="text-gray-600 text-sm">{meal.title}</p>
                    <p className="text-xs text-gray-500">{meal.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col">
          <header className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <MailOutlineIcon className="text-purple-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Nowe wiadomości</h2>
                <p className="text-xs text-gray-500">
                  Nieprzeczytane: {unreadCount || 'brak nowych wiadomości'}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/Parent/wiadomosci')}
              className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700"
            >
              Skrzynka odbiorcza
              <ArrowForwardIosIcon fontSize="inherit" />
            </button>
          </header>

          <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
            {recentMessages.map((msg) => (
              <li
                key={msg.id}
                className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>{new Date(msg.date).toLocaleString('pl-PL')}</span>
                  {!msg.isRead && (
                    <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                      <MarkEmailUnreadIcon fontSize="inherit" />
                      Nowa
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800">{msg.subject}</p>
                <p className="text-xs text-gray-600">{msg.sender}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{msg.preview}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col">
          <header className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <PaymentIcon className="text-emerald-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Saldo płatności</h2>
                <p className="text-xs text-gray-500">Podsumowanie nadchodzących zobowiązań</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/Parent/platnosci')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Pokaż szczegóły
              <ArrowForwardIosIcon fontSize="inherit" />
            </button>
          </header>

          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">
                Łączne saldo
              </p>
              <p className="text-2xl font-bold text-emerald-700">
                {outstandingTotal.toLocaleString('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                })}
              </p>
            </div>

            {nearestDue && (
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Najbliższa płatność</p>
                  <p className="text-xs text-gray-500">
                    {nearestDue.month} • termin{' '}
                    {new Date(nearestDue.dueDate).toLocaleDateString('pl-PL', {
                      day: '2-digit',
                      month: 'long',
                    })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {nearestDue.total.toLocaleString('pl-PL', {
                    style: 'currency',
                    currency: 'PLN',
                  })}
                </span>
              </div>
            )}

            {overdueTotal > 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm">
                <WarningAmberIcon fontSize="small" />
                Zaległe płatności: {overdueTotal.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Brak zaległości. Dziękujemy za terminowe wpłaty!
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}