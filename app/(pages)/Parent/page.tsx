'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Restaurant from '@mui/icons-material/Restaurant';
import FreeBreakfast from '@mui/icons-material/FreeBreakfast';
import LunchDining from '@mui/icons-material/LunchDining';
import BakeryDining from '@mui/icons-material/BakeryDining';
import ChildCare from '@mui/icons-material/ChildCare';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import PaymentIcon from '@mui/icons-material/Payment';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import { QrCodeIcon, Loader2 } from 'lucide-react';

type MealKey = 'BREAKFAST' | 'LUNCH' | 'SNACK';

interface MealPlanApi {
  id: string;
  mealType: string;
  name: string;
  description: string | null;
  date: string;
  allergens: string[];
}

interface Child {
  id: string;
  name: string;
  surname: string;
  age: number;
  group: {
    id: string;
    name: string;
  } | null;
  parent: {
    id: string;
    name: string;
    surname: string;
  };
}

interface Message {
  id: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    surname: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  description: string;
  dueDate: string;
  paidDate: string | null;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  child: {
    id: string;
    name: string;
    surname: string;
  };
}

const mealsOrder: Array<{ key: MealKey; label: string; Icon: typeof Restaurant }> = [
  { key: 'BREAKFAST', label: 'Śniadanie', Icon: FreeBreakfast },
  { key: 'LUNCH', label: 'Obiad', Icon: LunchDining },
  { key: 'SNACK', label: 'Podwieczorek', Icon: BakeryDining },
];

export default function ParentPage() {
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanApi[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const [attendanceStatus, setAttendanceStatus] = useState<'none' | 'arrived' | 'pickedUp'>('none');
  const [arrivalTime, setArrivalTime] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState<Date | null>(null);
  const [kodOdbioru, setKodOdbioru] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState(true);

  const fetchChildren = useCallback(async () => {
    try {
      setLoadingChildren(true);
      const res = await fetch('/api/children');
      if (res.ok) {
        const data = await res.json();
        setChildren(data);
      }
    } catch (err) {
      console.error('Error fetching children:', err);
    } finally {
      setLoadingChildren(false);
    }
  }, []);

  const fetchMealPlans = useCallback(async () => {
    try {
      setLoadingMeals(true);
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const day = now.getDate();

      const res = await fetch(`/api/menu?month=${month}&year=${year}`);
      if (res.ok) {
        const data: MealPlanApi[] = await res.json();
        const todaysMeals = data.filter(meal => {
          const mealDate = new Date(meal.date);
          return mealDate.getFullYear() === year &&
            mealDate.getMonth() + 1 === month &&
            mealDate.getDate() === day;
        });
        setMealPlans(todaysMeals);
      }
    } catch (err) {
      console.error('Error fetching meal plans:', err);
    } finally {
      setLoadingMeals(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      setLoadingMessages(true);
      const res = await fetch('/api/messages?type=inbox');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setLoadingPayments(true);
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
    fetchMealPlans();
    fetchMessages();
    fetchPayments();
    fetchPickupCode();
  }, [fetchChildren, fetchMealPlans, fetchMessages, fetchPayments]);

  const fetchPickupCode = async () => {
    try {
      setLoadingCode(true);
      const res = await fetch('/api/pickup-code');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setKodOdbioru(data[0].code);
        }
      }
    } catch (err) {
      console.error('Error fetching pickup code:', err);
    } finally {
      setLoadingCode(false);
    }
  };

  const selectedChild = children[0];

  const todaysMeals = useMemo(() => {
    const mealMap: Record<string, MealPlanApi> = {};
    mealPlans.forEach(meal => {
      mealMap[meal.mealType.toUpperCase()] = meal;
    });
    return mealMap;
  }, [mealPlans]);

  const { unreadCount, recentMessages } = useMemo(() => {
    const sorted = [...messages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return {
      unreadCount: messages.filter((msg) => !msg.isRead).length,
      recentMessages: sorted.slice(0, 3),
    };
  }, [messages]);

  const { outstandingTotal, overdueTotal, nearestDue } = useMemo(() => {
    const unpaidPayments = payments.filter(p => p.status !== 'PAID' && p.status !== 'CANCELLED');
    const total = unpaidPayments.reduce((sum, item) => sum + item.amount, 0);
    const overdue = unpaidPayments
      .filter((item) => item.status === 'OVERDUE')
      .reduce((sum, item) => sum + item.amount, 0);
    const nearest = unpaidPayments
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    return { outstandingTotal: total, overdueTotal: overdue, nearestDue: nearest };
  }, [payments]);

  const todayLabel = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  const handleConfirmArrival = async () => {
    if (!selectedChild) return;
    try {
      const res = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChild.id,
          date: new Date().toISOString(),
          status: 'PRESENT'
        })
      });
      if (res.ok) {
        if (attendanceStatus === 'pickedUp') {
          setPickupTime(null);
        }
        setAttendanceStatus('arrived');
        setArrivalTime(new Date());
      }
    } catch (err) {
      console.error('Error confirming arrival:', err);
    }
  };

  const handleConfirmPickup = async () => {
    if (attendanceStatus !== 'arrived' || !selectedChild) return;
    try {
      const res = await fetch('/api/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChild.id,
          pickupDate: new Date().toISOString().split('T')[0],
          pickupTime: new Date().toISOString(),
          authorizedPerson: selectedChild.parent.name + ' ' + selectedChild.parent.surname
        })
      });
      if (res.ok) {
        setAttendanceStatus('pickedUp');
        setPickupTime(new Date());
      }
    } catch (err) {
      console.error('Error confirming pickup:', err);
    }
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

  const refreshPickupCode = async () => {
    await fetchPickupCode();
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Panel rodzica</h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Szybki przegląd najważniejszych informacji z dzisiejszego dnia.
          </p>
        </div>
        <div className='flex flex-col sm:flex-row items-center gap-2 sm:gap-3'>
          <button
            className='inline-flex items-center gap-2 rounded-lg border cursor-pointer border-sky-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center'
            onClick={refreshPickupCode}
          >
            <RefreshIcon fontSize="small" />
            <span className="hidden sm:inline">Odśwież kod odbioru</span>
            <span className="sm:hidden">Odśwież</span>
          </button>
          <div className='flex items-center gap-2'>
            <QrCodeIcon className="h-4 w-4 shrink-0" />
            <p className='text-xs sm:text-sm text-gray-600'>
              Kod: <span className='font-semibold text-gray-800 text-lg sm:text-xl'>{kodOdbioru || 'Brak'}</span>
            </p>
          </div>
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="p-2 sm:p-3 bg-blue-50 rounded-2xl shrink-0">
            <ChildCare className="text-blue-500" fontSize="large" />
          </div>
          {loadingChildren ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs sm:text-sm">Ładowanie...</span>
            </div>
          ) : selectedChild ? (
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Dane dziecka
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                {selectedChild.name} {selectedChild.surname}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Grupa: <span className="font-semibold text-gray-800">{selectedChild.group?.name || 'Nieprzypisana'}</span>
              </p>
              <p className="text-xs text-gray-500 mt-2 hidden sm:block">
                Rodzic: {selectedChild.parent.name} {selectedChild.parent.surname}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Dane dziecka
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Brak przypisanych dzieci</p>
            </div>
          )}
        </div>
        <button
          onClick={() => router.push('/Parent/dziecko')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center shrink-0"
        >
          Zobacz profil
          <ArrowForwardIosIcon fontSize="inherit" />
        </button>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">Obecność dziecka</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Potwierdź przybycie dziecka do placówki oraz jego odbiór w ciągu dnia.
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 sm:px-4 py-2.5 sm:py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Przybycie</p>
              <p className="text-xs sm:text-sm font-medium text-gray-800 mt-1">
                {attendanceStatus === 'arrived' || attendanceStatus === 'pickedUp'
                  ? `Potwierdzone o ${formatTime(arrivalTime)}`
                  : 'Oczekuje na potwierdzenie'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 sm:px-4 py-2.5 sm:py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Odbiór</p>
              <p className="text-xs sm:text-sm font-medium text-gray-800 mt-1">
                {attendanceStatus === 'pickedUp'
                  ? `Potwierdzono odbiór o ${formatTime(pickupTime)}`
                  : 'Dziecko w placówce'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row flex-wrap items-stretch sm:items-center gap-2 shrink-0">
          <button
            onClick={handleConfirmArrival}
            disabled={attendanceStatus === 'arrived' || attendanceStatus === 'pickedUp'}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            <LoginIcon fontSize="small" />
            <span className="hidden sm:inline">
              {attendanceStatus === 'arrived' || attendanceStatus === 'pickedUp'
                ? 'Przybycie potwierdzone'
                : 'Potwierdź przybycie'}
            </span>
            <span className="sm:hidden">
              {attendanceStatus === 'arrived' || attendanceStatus === 'pickedUp'
                ? 'Potwierdzone'
                : 'Przybycie'}
            </span>
          </button>
          <button
            onClick={handleConfirmPickup}
            disabled={attendanceStatus !== 'arrived'}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed"
          >
            <LogoutIcon fontSize="small" />
            <span className="hidden sm:inline">
              {attendanceStatus === 'pickedUp' ? 'Odbiór potwierdzony' : 'Potwierdź odbiór'}
            </span>
            <span className="sm:hidden">
              {attendanceStatus === 'pickedUp' ? 'Potwierdzony' : 'Odbiór'}
            </span>
          </button>
          <button
            onClick={handleResetAttendance}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshIcon fontSize="small" />
            Resetuj
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col">
          <header className="flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Restaurant className="text-blue-500 shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Dzisiejszy jadłospis</h2>
                <p className="text-xs uppercase tracking-wide text-gray-500 truncate">{todayLabel}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/Parent/jadlospis')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 shrink-0"
            >
              <span className="hidden sm:inline">Zobacz całość</span>
              <span className="sm:hidden">Więcej</span>
              <ArrowForwardIosIcon fontSize="inherit" />
            </button>
          </header>

          {loadingMeals ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Ładowanie jadłospisu...
            </div>
          ) : mealPlans.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Brak jadłospisu na dzisiaj
            </div>
          ) : (
            <ul className="space-y-3 text-sm text-gray-700">
              {mealsOrder.map(({ key, label, Icon }) => {
                const meal = todaysMeals[key];
                if (!meal) return null;
                return (
                  <li key={key} className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                      <Icon className="text-blue-500" fontSize="small" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{label}</p>
                      <p className="text-gray-600 text-sm">{meal.name}</p>
                      {meal.description && (
                        <p className="text-xs text-gray-500">{meal.description}</p>
                      )}
                      {meal.allergens.length > 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          Alergeny: {meal.allergens.join(', ')}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col">
          <header className="flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <MailOutlineIcon className="text-purple-500 shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Nowe wiadomości</h2>
                <p className="text-xs text-gray-500">
                  Nieprzeczytane: {unreadCount || 'brak'}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/Parent/wiadomosci')}
              className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 shrink-0"
            >
              <span className="hidden sm:inline">Skrzynka</span>
              <span className="sm:hidden">Więcej</span>
              <ArrowForwardIosIcon fontSize="inherit" />
            </button>
          </header>

          {loadingMessages ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Ładowanie wiadomości...
            </div>
          ) : recentMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Brak wiadomości
            </div>
          ) : (
            <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
              {recentMessages.map((msg) => (
                <li
                  key={msg.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{new Date(msg.createdAt).toLocaleString('pl-PL')}</span>
                    {!msg.isRead && (
                      <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                        <MarkEmailUnreadIcon fontSize="inherit" />
                        Nowa
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{msg.subject}</p>
                  <p className="text-xs text-gray-600">{msg.sender.name} {msg.sender.surname}</p>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{msg.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col">
          <header className="flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <PaymentIcon className="text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Saldo płatności</h2>
                <p className="text-xs text-gray-500 hidden sm:block">Podsumowanie nadchodzących zobowiązań</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/Parent/platnosci')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 shrink-0"
            >
              <span className="hidden sm:inline">Szczegóły</span>
              <span className="sm:hidden">Więcej</span>
              <ArrowForwardIosIcon fontSize="inherit" />
            </button>
          </header>

          {loadingPayments ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Ładowanie płatności...
            </div>
          ) : (
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
                      {nearestDue.description} • termin{' '}
                      {new Date(nearestDue.dueDate).toLocaleDateString('pl-PL', {
                        day: '2-digit',
                        month: 'long',
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {nearestDue.amount.toLocaleString('pl-PL', {
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
              ) : payments.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Brak płatności do wyświetlenia.
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Brak zaległości. Dziękujemy za terminowe wpłaty!
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
