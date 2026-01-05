"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, CreditCard, Shield, Loader2 } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface Statistics {
    overview: {
        totalChildren: number;
        childrenWithAllergies: number;
        childrenWithSpecialNeeds: number;
        staffCount: number;
        groupsCount: number;
    };
    groups: Array<{
        id: string;
        name: string;
        ageRange: string;
        childrenCount: number;
        maxCapacity: number;
        staffCount: number;
        room: string | null;
        fillRate: string;
    }>;
    attendance: {
        today: {
            present: number;
            absent: number;
            pending: number;
        };
        weekly: Array<{
            date: string;
            present: number;
            absent: number;
            pending: number;
        }>;
    };
    payments: {
        pending: { count: number; amount: number };
        paid: { count: number; amount: number };
        overdue: { count: number; amount: number };
    };
    consents: {
        accepted: number;
        pending: number;
        rejected: number;
    };
    diets: Record<string, number>;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

const dietLabels: Record<string, string> = {
    STANDARD: "Standardowa",
    VEGETARIAN: "Wegetariańska",
    VEGAN: "Wegańska",
    GLUTEN_FREE: "Bezglutenowa",
    LACTOSE_FREE: "Bez laktozy",
    CUSTOM: "Indywidualna",
};

export default function StatisticsSection() {
    const [stats, setStats] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/reports/statistics");
                if (!res.ok) throw new Error("Błąd pobierania statystyk");
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error(err);
                setError("Nie udało się pobrać statystyk");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 sm:py-12">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-sky-600" />
                <span className="ml-2 text-xs sm:text-sm text-zinc-600">Ładowanie statystyk...</span>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4 text-center text-xs sm:text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error || "Brak danych do wyświetlenia"}
            </div>
        );
    }

    const totalToday = stats.attendance.today.present + stats.attendance.today.absent + stats.attendance.today.pending;
    const attendanceRate = totalToday > 0 ? ((stats.attendance.today.present / totalToday) * 100).toFixed(1) : "0";

    const consentData = [
        { name: "Zaakceptowane", value: stats.consents.accepted, color: "#10b981" },
        { name: "Oczekujące", value: stats.consents.pending, color: "#f59e0b" },
        { name: "Odrzucone", value: stats.consents.rejected, color: "#ef4444" },
    ].filter(d => d.value > 0);

    const dietData = Object.entries(stats.diets).map(([key, value], index) => ({
        name: dietLabels[key] || key,
        value,
        color: COLORS[index % COLORS.length],
    }));

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {/* Header */}
            <div>
                <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Statystyki w czasie rzeczywistym
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Przegląd najważniejszych danych przedszkola
                </p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:grid-cols-4">
                <div className="rounded-lg sm:rounded-xl border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="rounded-lg bg-sky-100 p-1.5 sm:p-2 dark:bg-sky-900/30 shrink-0">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                {stats.overview.totalChildren}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">Dzieci</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg sm:rounded-xl border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="rounded-lg bg-emerald-100 p-1.5 sm:p-2 dark:bg-emerald-900/30 shrink-0">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                {attendanceRate}%
                            </p>
                            <p className="text-xs text-zinc-500 truncate">Frekwencja dziś</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg sm:rounded-xl border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="rounded-lg bg-amber-100 p-1.5 sm:p-2 dark:bg-amber-900/30 shrink-0">
                            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {(stats.payments.pending.amount + stats.payments.overdue.amount).toFixed(0)} zł
                            </p>
                            <p className="text-xs text-zinc-500 truncate">Do zapłaty</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg sm:rounded-xl border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="rounded-lg bg-violet-100 p-1.5 sm:p-2 dark:bg-violet-900/30 shrink-0">
                            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                {stats.consents.pending}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">Zgody oczekujące</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Attendance Trend */}
                <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h4 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        Frekwencja (ostatnie 7 dni)
                    </h4>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.attendance.weekly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(val) => new Date(val).toLocaleDateString('pl-PL', { weekday: 'short' })}
                                    stroke="#9ca3af"
                                    fontSize={12}
                                />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip
                                    labelFormatter={(val) => new Date(val).toLocaleDateString('pl-PL')}
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="present"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Obecni"
                                    dot={{ fill: '#10b981', r: 3 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="absent"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    name="Nieobecni"
                                    dot={{ fill: '#ef4444', r: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Consents Pie Chart */}
                <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h4 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Status zgód RODO
                    </h4>
                    <div className="h-48 sm:h-56 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                        {consentData.length > 0 ? (
                            <>
                                <div className="w-full sm:w-[60%] h-[180px] sm:h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={consentData}
                                                innerRadius={30}
                                                outerRadius={50}
                                                paddingAngle={2}
                                                dataKey="value"
                                                cx="50%"
                                                cy="50%"
                                            >
                                                {consentData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-1">
                                    {consentData.map((entry, index) => (
                                        <div key={index} className="flex items-center gap-2 justify-center sm:justify-start">
                                            <div
                                                className="h-3 w-3 rounded-full shrink-0"
                                                style={{ backgroundColor: entry.color }}
                                            />
                                            <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                                                {entry.name}: <span className="font-semibold">{entry.value}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-xs sm:text-sm text-zinc-500 text-center w-full">Brak danych o zgodach</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Groups Table */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <h4 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
                    Zapełnienie grup
                </h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                <th className="py-2 text-left font-medium text-zinc-500">Grupa</th>
                                <th className="py-2 text-left font-medium text-zinc-500">Zakres wiekowy</th>
                                <th className="py-2 text-left font-medium text-zinc-500">Dzieci</th>
                                <th className="py-2 text-left font-medium text-zinc-500">Zapełnienie</th>
                                <th className="py-2 text-left font-medium text-zinc-500">Pracownicy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.groups.map((group) => (
                                <tr key={group.id} className="border-b border-zinc-100 dark:border-zinc-800">
                                    <td className="py-3 font-medium text-zinc-900 dark:text-zinc-100">{group.name}</td>
                                    <td className="py-3 text-zinc-600 dark:text-zinc-400">{group.ageRange}</td>
                                    <td className="py-3 text-zinc-600 dark:text-zinc-400">
                                        {group.childrenCount}/{group.maxCapacity}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700">
                                                <div
                                                    className="h-2 rounded-full bg-sky-500"
                                                    style={{ width: `${Math.min(parseFloat(group.fillRate), 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-zinc-500">{group.fillRate}%</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-zinc-600 dark:text-zinc-400">{group.staffCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Diet Breakdown */}
            {dietData.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h4 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        Rozkład diet
                    </h4>
                    <div className="flex flex-wrap gap-4">
                        {dietData.map((diet, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                            >
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: diet.color }}
                                />
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {diet.name}
                                </span>
                                <span className="text-sm text-zinc-500">({diet.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
