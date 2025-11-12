 'use client';

import { useMemo, useState } from 'react';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

type PaymentStatus = 'pending' | 'overdue';

type ChargeType = 'przedszkole' | 'posilki' | 'dodatkowe';

interface ChargeItem {
  id: string;
  type: ChargeType;
  label: string;
  amount: number;
}

interface UpcomingPayment {
  id: string;
  month: string;
  dueDate: string; // ISO date
  charges: ChargeItem[];
  status: PaymentStatus;
  notes?: string;
}

interface PaymentHistoryItem {
  id: string;
  month: string;
  charges: ChargeItem[];
  paymentDate: string; 
  method: 'Przelew online' | 'Gotówka' | 'Przelew tradycyjny';
  reference: string;
}

const upcomingSeed: UpcomingPayment[] = [
  {
    id: 'up-2025-02',
    month: 'Luty 2025',
    dueDate: '2025-02-10',
    charges: [
      { id: 'c1', type: 'przedszkole', label: 'Czesne podstawowe', amount: 480 },
      { id: 'c2', type: 'posilki', label: 'Wyżywienie (4 posiłki)', amount: 130 },
      { id: 'c3', type: 'dodatkowe', label: 'Warsztaty muzyczne', amount: 40 },
    ],
    status: 'pending',
    notes: 'Standardowe czesne + zajęcia dodatkowe',
  },
  {
    id: 'up-2025-03',
    month: 'Marzec 2025',
    dueDate: '2025-03-10',
    charges: [
      { id: 'c1', type: 'przedszkole', label: 'Czesne podstawowe', amount: 480 },
      { id: 'c2', type: 'posilki', label: 'Wyżywienie (4 posiłki)', amount: 130 },
      { id: 'c3', type: 'dodatkowe', label: 'Zajęcia sportowe', amount: 30 },
    ],
    status: 'pending',
    notes: 'Standardowe czesne',
  },
  {
    id: 'up-2025-01',
    month: 'Styczeń 2025',
    dueDate: '2025-01-10',
    charges: [
      { id: 'c1', type: 'przedszkole', label: 'Czesne podstawowe', amount: 480 },
      { id: 'c2', type: 'posilki', label: 'Wyżywienie (4 posiłki)', amount: 120 },
      { id: 'c3', type: 'dodatkowe', label: 'Materiał plastyczny', amount: 20 },
    ],
    status: 'overdue',
    notes: 'Prosimy o pilne uregulowanie należności za styczeń',
  },
];

const historySeed: PaymentHistoryItem[] = [
  {
    id: 'hist-2024-12',
    month: 'Grudzień 2024',
    charges: [
      { id: 'c1', type: 'przedszkole', label: 'Czesne podstawowe', amount: 480 },
      { id: 'c2', type: 'posilki', label: 'Wyżywienie (4 posiłki)', amount: 120 },
      { id: 'c3', type: 'dodatkowe', label: 'Teatrzyk mikołajkowy', amount: 20 },
    ],
    paymentDate: '2024-12-08T14:20:00',
    method: 'Przelew online',
    reference: 'OP-2024-12-001',
  },
  {
    id: 'hist-2024-11',
    month: 'Listopad 2024',
    charges: [
      { id: 'c1', type: 'przedszkole', label: 'Czesne podstawowe', amount: 480 },
      { id: 'c2', type: 'posilki', label: 'Wyżywienie (4 posiłki)', amount: 120 },
      { id: 'c3', type: 'dodatkowe', label: 'Basen', amount: 20 },
    ],
    paymentDate: '2024-11-10T09:30:00',
    method: 'Przelew tradycyjny',
    reference: 'OP-2024-11-005',
  },
  {
    id: 'hist-2024-10',
    month: 'Październik 2024',
    charges: [
      { id: 'c1', type: 'przedszkole', label: 'Czesne podstawowe', amount: 480 },
      { id: 'c2', type: 'posilki', label: 'Wyżywienie (4 posiłki)', amount: 110 },
      { id: 'c3', type: 'dodatkowe', label: 'Dzień dyni – warsztaty', amount: 20 },
    ],
    paymentDate: '2024-10-09T16:05:00',
    method: 'Gotówka',
    reference: 'KASA/2024/087',
  },
];

export default function PlatnosciPage() {
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>(upcomingSeed);
  const [history, setHistory] = useState<PaymentHistoryItem[]>(historySeed);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedChargeMap, setSelectedChargeMap] = useState<Record<string, string[]>>(() =>
    upcomingSeed.reduce<Record<string, string[]>>((acc, payment) => {
      acc[payment.id] = payment.charges.map((charge) => charge.id);
      return acc;
    }, {})
  );

  const totalOutstanding = useMemo(
    () =>
      upcomingPayments.reduce(
        (sum, item) =>
          sum + item.charges.reduce((chargeSum, charge) => chargeSum + charge.amount, 0),
        0
      ),
    [upcomingPayments]
  );

  const nearestDue = useMemo(() => {
    if (upcomingPayments.length === 0) return null;
    return [...upcomingPayments].sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))[0];
  }, [upcomingPayments]);

  const toggleChargeSelection = (payment: UpcomingPayment, chargeId: string) => {
    setSelectedChargeMap((prev) => {
      const current = prev[payment.id] ?? payment.charges.map((charge) => charge.id);
      const updated = current.includes(chargeId)
        ? current.filter((id) => id !== chargeId)
        : [...current, chargeId];
      return { ...prev, [payment.id]: updated };
    });
  };

  const toggleAllCharges = (payment: UpcomingPayment, selectAll: boolean) => {
    setSelectedChargeMap((prev) => ({
      ...prev,
      [payment.id]: selectAll ? payment.charges.map((charge) => charge.id) : [],
    }));
  };

  const handlePay = (payment: UpcomingPayment) => {
    if (isProcessing) return;

    const selectedIds =
      selectedChargeMap[payment.id] ?? payment.charges.map((charge) => charge.id);

    if (selectedIds.length === 0) {
      alert('Wybierz przynajmniej jedną pozycję do opłacenia.');
      return;
    }

    const chargesToPay = payment.charges.filter((charge) => selectedIds.includes(charge.id));
    if (chargesToPay.length === 0) {
      alert('Nie wybrano żadnych pozycji do opłacenia.');
      return;
    }

    const remainingCharges = payment.charges.filter(
      (charge) => !selectedIds.includes(charge.id)
    );

    setIsProcessing(payment.id);
    setTimeout(() => {
      setUpcomingPayments((prev) =>
        prev
          .map((item) =>
            item.id === payment.id
              ? remainingCharges.length === 0
                ? null
                : {
                    ...item,
                    charges: remainingCharges,
                  }
              : item
          )
          .filter(Boolean) as UpcomingPayment[]
      );
      setHistory((prev) => [
        {
          id: `hist-${payment.id}-${Date.now()}`,
          month: payment.month,
          charges: chargesToPay,
          paymentDate: new Date().toISOString(),
          method: 'Przelew online',
          reference: `OP-${payment.id.toUpperCase()}`,
        },
        ...prev,
      ]);
      setSelectedChargeMap((prev) => {
        const updated = { ...prev };
        if (remainingCharges.length === 0) {
          delete updated[payment.id];
        } else {
          updated[payment.id] = remainingCharges.map((charge) => charge.id);
        }
        return updated;
      });
      setIsProcessing(null);
      const amountPaid = chargesToPay.reduce((sum, charge) => sum + charge.amount, 0);
      alert(
        `Opłata za ${payment.month} (${chargesToPay
          .map((charge) => charge.label)
          .join(', ')}) została zarejestrowana. Kwota: ${amountPaid.toLocaleString('pl-PL', {
          style: 'currency',
          currency: 'PLN',
        })}.`
      );
    }, 1000);
  };

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
                <th className="px-5 py-3">Miesiąc</th>
                <th className="px-5 py-3">Termin płatności</th>
                <th className="px-5 py-3">Skład opłaty</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Uwagi</th>
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
                    <td className="px-5 py-4 font-medium text-gray-800">{payment.month}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {new Date(payment.dueDate).toLocaleDateString('pl-PL', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-gray-700 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Wybierz pozycje do opłacenia</span>
                          <button
                            onClick={() =>
                              toggleAllCharges(
                                payment,
                                !(
                                  (selectedChargeMap[payment.id] ??
                                    payment.charges.map((charge) => charge.id)
                                  ).length === payment.charges.length
                                )
                              )
                            }
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          >
                            {(
                              selectedChargeMap[payment.id] ??
                              payment.charges.map((charge) => charge.id)
                            ).length === payment.charges.length ? (
                              <>
                                <CheckBoxIcon fontSize="inherit" />
                                Odznacz wszystkie
                              </>
                            ) : (
                              <>
                                <CheckBoxOutlineBlankIcon fontSize="inherit" />
                                Zaznacz wszystkie
                              </>
                            )}
                          </button>
                        </div>
                        <ul className="space-y-1">
                          {payment.charges.map((charge) => {
                            const selectedIds =
                              selectedChargeMap[payment.id] ??
                              payment.charges.map((item) => item.id);
                            const isSelected = selectedIds.includes(charge.id);
                            return (
                              <li
                                key={charge.id}
                                className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-white px-3 py-2"
                              >
                                <label className="flex items-center gap-2 font-medium text-gray-800">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleChargeSelection(payment, charge.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                  />
                                  {charge.label}
                                </label>
                                <span className="text-gray-600">
                                  {charge.amount.toLocaleString('pl-PL', {
                                    style: 'currency',
                                    currency: 'PLN',
                                  })}
                                </span>
                              </li>
                            );
                          })}
                          <li className="border-t border-gray-100 pt-1 flex items-center justify-between text-sm font-semibold text-gray-900">
                            <span>Łącznie</span>
                            <span>
                              {(
                                selectedChargeMap[payment.id] ??
                                payment.charges.map((charge) => charge.id)
                              )
                                .map(
                                  (chargeId) =>
                                    payment.charges.find((charge) => charge.id === chargeId)
                                      ?.amount ?? 0
                                )
                                .reduce((sum, value) => sum + value, 0)
                                .toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          payment.status === 'pending'
                            ? 'border border-blue-200 bg-blue-50 text-blue-600'
                            : 'border border-amber-200 bg-amber-50 text-amber-600'
                        }`}
                      >
                        {payment.status === 'pending' ? (
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
                    <td className="px-5 py-4 text-gray-500 text-sm">
                      {payment.notes ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {(() => {
                        const selectedIds =
                          selectedChargeMap[payment.id] ??
                          payment.charges.map((charge) => charge.id);
                        const selectedTotal = payment.charges
                          .filter((charge) => selectedIds.includes(charge.id))
                          .reduce((sum, charge) => sum + charge.amount, 0);
                        return (
                          <button
                            onClick={() => handlePay(payment)}
                            disabled={isProcessing === payment.id || selectedTotal === 0}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-300"
                          >
                            <CheckCircleIcon fontSize="small" />
                            {isProcessing === payment.id
                              ? 'Przetwarzanie...'
                              : selectedTotal > 0
                              ? `Zapłać ${selectedTotal.toLocaleString('pl-PL', {
                                  style: 'currency',
                                  currency: 'PLN',
                                })}`
                              : 'Wybierz pozycje'}
                          </button>
                        );
                      })()}
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
              Zobacz ostatnie transakcje wraz z numerem referencyjnym oraz formą płatności.
            </p>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Miesiąc</th>
                <th className="px-5 py-3">Data płatności</th>
                <th className="px-5 py-3">Skład opłaty</th>
                <th className="px-5 py-3">Metoda</th>
                <th className="px-5 py-3">Numer ref.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-gray-500 text-sm">
                    Brak zarejestrowanych płatności.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-800">{item.month}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {new Date(item.paymentDate).toLocaleString('pl-PL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4 text-gray-700 text-sm">
                      <ul className="space-y-1">
                        {item.charges.map((charge) => (
                          <li key={charge.id} className="flex items-center justify-between gap-4">
                            <span className="font-medium text-gray-800">{charge.label}</span>
                            <span className="text-gray-600">
                              {charge.amount.toLocaleString('pl-PL', {
                                style: 'currency',
                                currency: 'PLN',
                              })}
                            </span>
                          </li>
                        ))}
                        <li className="border-t border-gray-100 pt-1 flex items-center justify-between text-sm font-semibold text-gray-900">
                          <span>Łącznie</span>
                          <span>
                            {item.charges
                              .reduce((sum, charge) => sum + charge.amount, 0)
                              .toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                          </span>
                        </li>
                      </ul>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{item.method}</td>
                    <td className="px-5 py-4 text-gray-500">{item.reference}</td>
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

