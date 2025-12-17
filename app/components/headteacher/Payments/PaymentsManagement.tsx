"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    Search,
    Plus,
    Edit2,
    Trash2,
    CheckCircle,
    AlertCircle,
    Clock,
    XCircle,
    RefreshCw,
} from "lucide-react";
import { useModal } from "@/app/components/global/Modal/ModalContext";
import { CreatePaymentForm } from "./CreatePaymentForm";

interface ApiPayment {
    id: string;
    childId: string;
    amount: number;
    description: string;
    dueDate: string;
    paidDate: string | null;
    status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
    createdAt: string;
    child: {
        id: string;
        name: string;
        surname: string;
    };
}

interface Group {
    id: string;
    name: string;
}

interface Child {
    id: string;
    name: string;
    surname: string;
    groupId: string | null;
}

const statusOptions = [
    { value: "ALL", label: "Wszystkie statusy" },
    { value: "PENDING", label: "Oczekujące" },
    { value: "PAID", label: "Opłacone" },
    { value: "OVERDUE", label: "Zaległe" },
    { value: "CANCELLED", label: "Anulowane" },
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case "PENDING":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <Clock className="h-3 w-3" />
                    Oczekujące
                </span>
            );
        case "PAID":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="h-3 w-3" />
                    Opłacone
                </span>
            );
        case "OVERDUE":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="h-3 w-3" />
                    Zaległe
                </span>
            );
        case "CANCELLED":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                    <XCircle className="h-3 w-3" />
                    Anulowane
                </span>
            );
        default:
            return null;
    }
};

export function PaymentsManagement() {
    const { showModal } = useModal();

    const [payments, setPayments] = useState<ApiPayment[]>([]);
    const [children, setChildren] = useState<Child[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [groupFilter, setGroupFilter] = useState("ALL");

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingPayment, setEditingPayment] = useState<ApiPayment | null>(null);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [paymentsRes, childrenRes, groupsRes] = await Promise.all([
                fetch("/api/payments"),
                fetch("/api/children"),
                fetch("/api/groups"),
            ]);

            if (!paymentsRes.ok) throw new Error("Błąd pobierania płatności");
            if (!childrenRes.ok) throw new Error("Błąd pobierania dzieci");
            if (!groupsRes.ok) throw new Error("Błąd pobierania grup");

            const [paymentsData, childrenData, groupsData] = await Promise.all([
                paymentsRes.json(),
                childrenRes.json(),
                groupsRes.json(),
            ]);

            setPayments(paymentsData);
            setChildren(childrenData);
            setGroups(groupsData);
        } catch (err) {
            console.error(err);
            setError("Nie udało się pobrać danych");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredPayments = payments.filter((payment) => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const childName =
                `${payment.child.name} ${payment.child.surname}`.toLowerCase();
            const description = payment.description.toLowerCase();
            if (!childName.includes(query) && !description.includes(query)) {
                return false;
            }
        }

        // Status filter
        if (statusFilter !== "ALL" && payment.status !== statusFilter) {
            return false;
        }

        // Group filter
        if (groupFilter !== "ALL") {
            const child = children.find((c) => c.id === payment.childId);
            if (!child || child.groupId !== groupFilter) {
                return false;
            }
        }

        return true;
    });

    const handleDelete = async (payment: ApiPayment) => {
        showModal("warning", `Czy na pewno chcesz usunąć płatność "${payment.description}" dla ${payment.child.name} ${payment.child.surname}?`, {
            title: "Usuń płatność",
            confirmText: "Usuń",
            onConfirm: async () => {
                try {
                    setIsProcessing(payment.id);
                    const res = await fetch(`/api/payments/${payment.id}`, {
                        method: "DELETE",
                    });

                    if (!res.ok) throw new Error("Błąd usuwania płatności");

                    await fetchData();
                    showModal("success", "Płatność została usunięta");
                } catch (err) {
                    console.error(err);
                    showModal("error", "Wystąpił błąd podczas usuwania płatności");
                } finally {
                    setIsProcessing(null);
                }
            },
        });
    };


    const handleStatusChange = async (
        payment: ApiPayment,
        newStatus: string
    ) => {
        try {
            setIsProcessing(payment.id);
            const res = await fetch(`/api/payments/${payment.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Błąd zmiany statusu");

            await fetchData();
            showModal("success", "Status płatności został zmieniony");
        } catch (err) {
            console.error(err);
            showModal("error", "Wystąpił błąd podczas zmiany statusu");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingPayment(null);
        fetchData();
    };

    const handleEdit = (payment: ApiPayment) => {
        setEditingPayment(payment);
        setShowForm(true);
    };

    // Summary stats
    const totalPending = payments
        .filter((p) => p.status === "PENDING" || p.status === "OVERDUE")
        .reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = payments
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0);

    if (loading) {
        return (
            <div className="p-8 min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Ładowanie danych...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center text-red-600">
                    <p>{error}</p>
                    <Button onClick={fetchData} variant="outline" className="mt-4">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Spróbuj ponownie
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">
                        Zarządzanie płatnościami
                    </h1>
                    <p className="text-sm text-gray-600">
                        Wystawiaj i zarządzaj płatnościami dla dzieci
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                        <AlertCircle className="h-4 w-4" />
                        Oczekujące:{" "}
                        <strong>
                            {totalPending.toLocaleString("pl-PL", {
                                style: "currency",
                                currency: "PLN",
                            })}
                        </strong>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                        <CheckCircle className="h-4 w-4" />
                        Opłacone:{" "}
                        <strong>
                            {totalPaid.toLocaleString("pl-PL", {
                                style: "currency",
                                currency: "PLN",
                            })}
                        </strong>
                    </div>
                </div>
            </div>

            {/* Actions and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <Button
                    onClick={() => {
                        setEditingPayment(null);
                        setShowForm(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Wystaw płatność
                </Button>

                <div className="flex-1 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Szukaj po nazwisku lub opisie..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={groupFilter} onValueChange={setGroupFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Grupa" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Wszystkie grupy</SelectItem>
                            {groups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Form modal/section */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                    <CreatePaymentForm
                        children={children}
                        groups={groups}
                        editingPayment={editingPayment}
                        onSuccess={handleFormSuccess}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingPayment(null);
                        }}
                    />
                </div>
            )}

            {/* Payments table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm text-left">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-5 py-3">Dziecko</th>
                                <th className="px-5 py-3">Opis</th>
                                <th className="px-5 py-3">Kwota</th>
                                <th className="px-5 py-3">Termin</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-8 text-center text-gray-500"
                                    >
                                        {payments.length === 0
                                            ? "Brak płatności. Kliknij 'Wystaw płatność' aby dodać pierwszą."
                                            : "Brak płatności pasujących do filtrów."}
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr
                                        key={payment.id}
                                        className="hover:bg-gray-50/70 transition-colors"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-gray-800">
                                                {payment.child.name} {payment.child.surname}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-gray-700">
                                            {payment.description}
                                        </td>
                                        <td className="px-5 py-4 font-semibold text-gray-900">
                                            {payment.amount.toLocaleString("pl-PL", {
                                                style: "currency",
                                                currency: "PLN",
                                            })}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            {new Date(payment.dueDate).toLocaleDateString("pl-PL", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-5 py-4">
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {payment.status === "PENDING" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleStatusChange(payment, "PAID")
                                                        }
                                                        disabled={isProcessing === payment.id}
                                                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                        Oznacz opłacone
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEdit(payment)}
                                                    disabled={isProcessing === payment.id}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(payment)}
                                                    disabled={isProcessing === payment.id}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
