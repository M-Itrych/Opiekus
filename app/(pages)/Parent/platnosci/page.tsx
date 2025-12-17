'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Loader2 } from 'lucide-react';
import { useModal } from '@/app/components/global/Modal/ModalContext';

interface ApiPayment {
  id: string;
  childId: string;
  amount: number;
  description: string;
  dueDate: string;
  paidDate: string | null;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  createdAt: string;
  child: {
    id: string;
    name: string;
    surname: string;
  };
}

export default function PlatnosciPage() {
  const { showModal } = useModal();
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/payments');
      if (!res.ok) throw new Error('Błąd pobierania płatności');

      const data: ApiPayment[] = await res.json();
      setPayments(data);
    } catch (err) {
      console.error(err);
      setError('Nie udało się pobrać płatności');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const { upcomingPayments, paidPayments } = useMemo(() => {
    const upcoming = payments.filter(
      (p) => p.status === 'PENDING' || p.status === 'OVERDUE'
    );
    const paid = payments.filter((p) => p.status === 'PAID');
    return { upcomingPayments: upcoming, paidPayments: paid };
  }, [payments]);

  const totalOutstanding = useMemo(
    () => upcomingPayments.reduce((sum, item) => sum + item.amount, 0),
    [upcomingPayments]
  );

  const nearestDue = useMemo(() => {
    if (upcomingPayments.length === 0) return null;
    return [...upcomingPayments].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0];
  }, [upcomingPayments]);

  const handlePay = async (payment: ApiPayment) => {
    if (isProcessing) return;

    setIsProcessing(payment.id);
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      });

      if (!res.ok) throw new Error('Błąd przetwarzania płatności');

      await fetchPayments();
      showModal('success', `Opłata została zarejestrowana. Kwota: ${payment.amount.toLocaleString('pl-PL', {
        style: 'currency',
        currency: 'PLN',
      })}`);
    } catch (err) {
      console.error(err);
      showModal('error', 'Wystąpił błąd podczas przetwarzania płatności');
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Ładowanie płatności...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 min-h-[60vh] flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchPayments}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Płatności</h1>
          <p className="text-sm text-gray-600">
            Zarządzaj czesnym, sprawdzaj nadchodzące zobowiązania oraz historię opłat za przedszkole.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
            <AccountBalanceWalletIcon fontSize="small" />
            Suma zaległości:{' '}
            <strong className="text-blue-900">
              {totalOutstanding.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </strong>
          </div>
          {nearestDue && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
              <CalendarMonthIcon fontSize="small" />
              Najbliższy termin:{' '}
              <strong>
                {new Date(nearestDue.dueDate).toLocaleDateString('pl-PL', {
                  day: '2-digit',
                  month: 'long',
                })}
              </strong>
            </div>
          )}
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <PaymentIcon className="text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Nadchodzące płatności</h2>
              <p className="text-xs text-gray-500">
                Opłać wybrany miesiąc online lub zaznacz jako uregulowane po wykonaniu przelewu.
              </p>
            </div>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Dziecko</th>
                <th className="px-5 py-3">Opis</th>
                <th className="px-5 py-3">Termin płatności</th>
                <th className="px-5 py-3">Kwota</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {upcomingPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-gray-500 text-sm">
                    Brak nadchodzących płatności.
                  </td>
                </tr>
              ) : (
                upcomingPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {payment.child.name} {payment.child.surname}
                    </td>
                    <td className="px-5 py-4 text-gray-700">{payment.description}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {new Date(payment.dueDate).toLocaleDateString('pl-PL', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {payment.amount.toLocaleString('pl-PL', {
                        style: 'currency',
                        currency: 'PLN',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${payment.status === 'PENDING'
                            ? 'border border-blue-200 bg-blue-50 text-blue-600'
                            : 'border border-amber-200 bg-amber-50 text-amber-600'
                          }`}
                      >
                        {payment.status === 'PENDING' ? (
                          <>
                            <HourglassBottomIcon fontSize="inherit" />
                            Oczekujące
                          </>
                        ) : (
                          <>
                            <WarningAmberIcon fontSize="inherit" />
                            Zaległe
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handlePay(payment)}
                        disabled={isProcessing === payment.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        <CheckCircleIcon fontSize="small" />
                        {isProcessing === payment.id
                          ? 'Przetwarzanie...'
                          : `Zapłać ${payment.amount.toLocaleString('pl-PL', {
                            style: 'currency',
                            currency: 'PLN',
                          })}`}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <header className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <HistoryIcon className="text-emerald-500" />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Historia płatności</h2>
            <p className="text-xs text-gray-500">
              Zobacz ostatnie transakcje wraz z datą opłacenia.
            </p>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Dziecko</th>
                <th className="px-5 py-3">Opis</th>
                <th className="px-5 py-3">Data płatności</th>
                <th className="px-5 py-3">Kwota</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paidPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-gray-500 text-sm">
                    Brak zarejestrowanych płatności.
                  </td>
                </tr>
              ) : (
                paidPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {payment.child.name} {payment.child.surname}
                    </td>
                    <td className="px-5 py-4 text-gray-700">{payment.description}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {payment.paidDate
                        ? new Date(payment.paidDate).toLocaleString('pl-PL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : '-'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {payment.amount.toLocaleString('pl-PL', {
                        style: 'currency',
                        currency: 'PLN',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-600">
                        <CheckCircleIcon fontSize="inherit" />
                        Opłacone
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
