'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { EventNote, CheckCircle, Cancel, CalendarToday, Save, ReportProblem, Close } from '@mui/icons-material';
import { Loader2 } from 'lucide-react';
import { useModal } from '@/app/components/global/Modal/ModalContext';

type DayStatus = 'present' | 'absent' | 'pending';

interface AttendanceData {
  id?: string;
  status: DayStatus;
  reason?: string;
}

interface DayData {
  date: Date;
  status: DayStatus;
  reason?: string;
  id?: string;
}

interface ApiAttendance {
  id: string;
  childId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'PENDING';
  reason: string | null;
  child: {
    id: string;
    name: string;
    surname: string;
  };
}

interface Child {
  id: string;
  name: string;
  surname: string;
}

export default function ObecnosciPage() {
  const { showModal } = useModal();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [absenceReason, setAbsenceReason] = useState('');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [modifiedKeys, setModifiedKeys] = useState<Set<string>>(new Set());

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [attendance, setAttendance] = useState<{ [key: string]: AttendanceData }>({});
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async (selectFirst = false) => {
    try {
      const res = await fetch('/api/children');
      if (res.ok) {
        const data = await res.json();
        setChildren(data);
        if (selectFirst && data.length > 0) {
          setSelectedChildId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching children:', err);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!selectedChildId) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);

      const res = await fetch(
        `/api/attendances?childId=${selectedChildId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!res.ok) throw new Error('Błąd pobierania obecności');

      const data: ApiAttendance[] = await res.json();

      const attendanceMap: { [key: string]: AttendanceData } = {};
      data.forEach((item) => {
        const dateKey = formatDateKey(new Date(item.date));
        attendanceMap[dateKey] = {
          id: item.id,
          status: item.status.toLowerCase() as DayStatus,
          reason: item.reason || undefined,
        };
      });

      setAttendance(attendanceMap);
      setHasChanges(false);
      setModifiedKeys(new Set());
    } catch (err) {
      console.error(err);
      setError('Nie udało się pobrać danych obecności');
    } finally {
      setLoading(false);
    }
  }, [selectedChildId, selectedMonth, selectedYear]);

  const fetchAllAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);

      const res = await fetch(
        `/api/attendances?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!res.ok) throw new Error('Błąd pobierania obecności');

      const data: ApiAttendance[] = await res.json();

      const uniqueChildren: { [key: string]: Child } = {};
      data.forEach((item) => {
        if (!uniqueChildren[item.child.id]) {
          uniqueChildren[item.child.id] = item.child;
        }
      });

      const childList = Object.values(uniqueChildren);
      setChildren(childList);

      if (childList.length > 0 && !selectedChildId) {
        setSelectedChildId(childList[0].id);
      }

      if (selectedChildId) {
        const attendanceMap: { [key: string]: AttendanceData } = {};
        data
          .filter((item) => item.childId === selectedChildId)
          .forEach((item) => {
            const dateKey = formatDateKey(new Date(item.date));
            attendanceMap[dateKey] = {
              id: item.id,
              status: item.status.toLowerCase() as DayStatus,
              reason: item.reason || undefined,
            };
          });
        setAttendance(attendanceMap);
      }

      setHasChanges(false);
      setModifiedKeys(new Set());
    } catch (err) {
      console.error(err);
      setError('Nie udało się pobrać danych obecności');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedChildId]);

  useEffect(() => {
    fetchChildren(true);
  }, [fetchChildren]);

  useEffect(() => {
    if (selectedChildId) {
      fetchAllAttendances();
    }
  }, [fetchAllAttendances, selectedChildId]);

  useEffect(() => {
    if (selectedChildId) {
      fetchAttendance();
    }
  }, [selectedChildId, fetchAttendance]);

  const daysInMonth = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: DayData[] = [];

    const startDayOfWeek = firstDay.getDay();
    const daysFromPrevMonth = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        status: 'pending' as DayStatus
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const attendanceData = attendance[dateKey];
      const status = attendanceData?.status || (date < new Date() ? 'present' : 'pending');

      days.push({
        date,
        status,
        reason: attendanceData?.reason,
        id: attendanceData?.id
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        status: 'pending' as DayStatus
      });
    }

    return days;
  }, [selectedMonth, selectedYear, attendance]);

  const stats = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonth;
    const lastDay = new Date(year, month + 1, 0);
    let present = 0;
    let absent = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);

      if (date <= today && date.getDay() !== 0 && date.getDay() !== 6) {
        const status = attendance[dateKey]?.status || 'present';
        if (status === 'present') {
          present++;
        } else if (status === 'absent') {
          absent++;
        }
      }
    }

    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, total, percentage };
  }, [selectedMonth, selectedYear, attendance]);

  const handleOpenModal = (date?: Date, existingReason?: string) => {
    setIsModalOpen(true);
    setSelectedDate(date || new Date());
    setAbsenceReason(existingReason || '');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setAbsenceReason('');
  };

  const handleSubmitAbsence = () => {
    if (!selectedDate || !absenceReason.trim()) {
      showModal('warning', 'Proszę wybrać datę i podać powód nieobecności');
      return;
    }

    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected.getDay() === 0 || selected.getDay() === 6) {
      showModal('warning', 'Nie można zgłaszać nieobecności na weekend');
      return;
    }

    const dateKey = formatDateKey(selected);
    setAttendance(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        status: 'absent',
        reason: absenceReason.trim()
      }
    }));
    setModifiedKeys(prev => new Set(prev).add(dateKey));
    setHasChanges(true);
    handleCloseModal();

    if (selected.getMonth() !== selectedMonth || selected.getFullYear() !== selectedYear) {
      setSelectedMonth(selected.getMonth());
      setSelectedYear(selected.getFullYear());
    }
  };

  const handleRemoveAbsence = () => {
    if (!selectedDate) return;

    const dateKey = formatDateKey(selectedDate);
    setAttendance(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        status: 'present',
        reason: undefined
      }
    }));
    setModifiedKeys(prev => new Set(prev).add(dateKey));
    setHasChanges(true);
    handleCloseModal();
  };

  const handleSave = async () => {
    if (!selectedChildId) {
      showModal('warning', 'Nie wybrano dziecka');
      return;
    }

    setIsSaving(true);
    try {
      for (const dateKey of modifiedKeys) {
        const data = attendance[dateKey];
        if (data) {
          await fetch('/api/attendances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              childId: selectedChildId,
              date: dateKey,
              status: data.status.toUpperCase(),
              reason: data.reason || '',
            }),
          });
        }
      }

      setHasChanges(false);
      setModifiedKeys(new Set());
      showModal('success', 'Zmiany zostały zapisane!');
      fetchAttendance();
    } catch (err) {
      console.error(err);
      showModal('error', 'Wystąpił błąd podczas zapisywania');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  const dayNames = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'];

  const getDayClassName = (day: DayData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = day.date.getTime() === today.getTime();
    const isCurrentMonth = day.date.getMonth() === selectedMonth;
    const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

    let baseClasses = 'w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ';

    if (!isCurrentMonth) {
      return baseClasses + 'text-gray-300 cursor-not-allowed';
    }

    if (isWeekend) {
      return baseClasses + 'text-gray-400 cursor-not-allowed bg-gray-50';
    }

    if (isToday) {
      baseClasses += 'ring-2 ring-blue-500 ';
    }

    if (day.status === 'absent') {
      return baseClasses + 'bg-red-100 text-red-700 hover:bg-red-200';
    } else if (day.status === 'present') {
      return baseClasses + 'bg-green-100 text-green-700 hover:bg-green-200';
    } else {
      return baseClasses + 'bg-gray-50 text-gray-600';
    }
  };

  if (loading && children.length === 0) {
    return (
      <div className="p-3 sm:p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
          <p className="text-xs sm:text-sm">Ładowanie danych obecności...</p>
        </div>
      </div>
    );
  }

  if (error && children.length === 0) {
    return (
      <div className="p-3 sm:p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-600 px-4">
          <p className="text-xs sm:text-sm">{error}</p>
          <button
            onClick={fetchAllAttendances}
            className="mt-4 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Obecności</h1>
          <p className="text-xs sm:text-sm text-gray-600">Zarządzaj obecnością dziecka w przedszkolu</p>
          {children.length > 1 && (
            <select
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="mt-2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm w-full sm:w-auto"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} {child.surname}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-1.5 sm:gap-2 bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm"
          >
            <ReportProblem fontSize="small" />
            <span className="hidden sm:inline">Zgłoś nieobecność</span>
            <span className="sm:hidden">Zgłoś</span>
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 sm:gap-2 bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              <Save fontSize="small" />
              <span className="hidden sm:inline">{isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
              <span className="sm:hidden">{isSaving ? '...' : 'Zapisz'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <CheckCircle className="text-green-500" fontSize="small" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Obecności</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.present}</p>
          <p className="text-xs text-gray-500 mt-1">dni obecności</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Cancel className="text-red-500" fontSize="small" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Nieobecności</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.absent}</p>
          <p className="text-xs text-gray-500 mt-1">dni nieobecności</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <CalendarToday className="text-blue-500" fontSize="small" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Razem</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">dni robocze</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <EventNote className="text-purple-500" fontSize="small" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Frekwencja</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.percentage}%</p>
          <p className="text-xs text-gray-500 mt-1">w tym miesiącu</p>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 overflow-x-auto">
        <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
          <button
            onClick={() => handleMonthChange('prev')}
            className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">← Poprzedni</span>
            <span className="sm:hidden">←</span>
          </button>
          <h2 className="text-base sm:text-xl font-semibold text-gray-800 text-center flex-1">
            {monthNames[selectedMonth]} {selectedYear}
          </h2>
          <button
            onClick={() => handleMonthChange('next')}
            className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Następny →</span>
            <span className="sm:hidden">→</span>
          </button>
        </div>


        <div className="grid grid-cols-7 justify-items-center gap-1 sm:gap-2 mb-2 min-w-[280px]">
          {dayNames.map((day, index) => (
            <div
              key={index}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide"
            >
              {day.substring(0, 2)}
            </div>
          ))}
        </div>


        <div className="grid grid-cols-7 justify-items-center gap-1 sm:gap-2 min-w-[280px]">
          {daysInMonth.map((day, index) => {
            const dateKey = formatDateKey(day.date);
            const isHovered = hoveredDay === dateKey;
            const hasReason = day.reason && day.status === 'absent';

            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredDay(dateKey)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`${getDayClassName(day)} relative`}
                title={day.reason && day.status === 'absent' ? `Powód nieobecności: ${day.reason}` : ''}
              >
                {day.date.getDate()}
                {hasReason && isHovered && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg max-w-xs z-50 pointer-events-none shadow-lg">
                    <div className="font-semibold mb-1">Powód nieobecności:</div>
                    <div className="whitespace-normal">{day.reason}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-gray-600">Obecny</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-gray-600">Nieobecny</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-50 border border-gray-300 rounded"></div>
            <span className="text-gray-600">Nie zaznaczono</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-100 border-2 border-blue-500 rounded"></div>
            <span className="text-gray-600">Dzisiaj</span>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Informacje</h3>
        <p className="text-blue-700 text-xs sm:text-sm">
          Aby zgłosić lub edytować nieobecność, użyj czerwonego przycisku &quot;Zgłoś nieobecność&quot; powyżej.
          Kalendarz służy do podglądu statusu i powodów nieobecności (najedź kursorem na zaznaczony dzień).
          Pamiętaj, aby po wprowadzeniu zmian kliknąć &quot;Zapisz zmiany&quot;.
        </p>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Zgłoś nieobecność</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Close />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Data nieobecności
                </label>
                <input
                  type="date"
                  value={selectedDate ? formatDateKey(selectedDate) : ''}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    setSelectedDate(newDate);
                    const key = formatDateKey(newDate);
                    if (attendance[key]?.status === 'absent') {
                      setAbsenceReason(attendance[key].reason || '');
                    } else {
                      setAbsenceReason('');
                    }
                  }}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Powód nieobecności <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  placeholder="Np. choroba, wizyta u lekarza, wyjazd rodzinny..."
                  rows={4}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-xs sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wymagane. Podaj powód nieobecności dziecka.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
              >
                Anuluj
              </button>
              {selectedDate && attendance[formatDateKey(selectedDate)]?.status === 'absent' && (
                <button
                  onClick={handleRemoveAbsence}
                  className="px-3 sm:px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs sm:text-sm"
                >
                  Usuń
                </button>
              )}
              <button
                onClick={handleSubmitAbsence}
                className="flex-1 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm"
              >
                {selectedDate && attendance[formatDateKey(selectedDate)]?.status === 'absent'
                  ? 'Zaktualizuj'
                  : 'Zgłoś nieobecność'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
