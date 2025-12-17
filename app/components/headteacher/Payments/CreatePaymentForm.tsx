"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X, User, Users } from "lucide-react";
import { useModal } from "@/app/components/global/Modal/ModalContext";

interface Child {
    id: string;
    name: string;
    surname: string;
    groupId: string | null;
}

interface Group {
    id: string;
    name: string;
}

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

interface CreatePaymentFormProps {
    children: Child[];
    groups: Group[];
    editingPayment: ApiPayment | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const statusOptions = [
    { value: "PENDING", label: "Oczekujące" },
    { value: "PAID", label: "Opłacone" },
    { value: "OVERDUE", label: "Zaległe" },
    { value: "CANCELLED", label: "Anulowane" },
];

type PaymentMode = "single" | "group";

export function CreatePaymentForm({
    children,
    groups,
    editingPayment,
    onSuccess,
    onCancel,
}: CreatePaymentFormProps) {
    const { showModal } = useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Payment mode: single child or whole group
    const [paymentMode, setPaymentMode] = useState<PaymentMode>("single");

    // Form state
    const [childId, setChildId] = useState(editingPayment?.childId || "");
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [amount, setAmount] = useState(
        editingPayment ? String(editingPayment.amount) : ""
    );
    const [description, setDescription] = useState(
        editingPayment?.description || ""
    );
    const [dueDate, setDueDate] = useState(
        editingPayment
            ? new Date(editingPayment.dueDate).toISOString().split("T")[0]
            : ""
    );
    const [status, setStatus] = useState(editingPayment?.status || "PENDING");

    // Group filter for children select (single mode only)
    const [groupFilter, setGroupFilter] = useState("ALL");

    const filteredChildren =
        groupFilter === "ALL"
            ? children
            : children.filter((c) => c.groupId === groupFilter);

    // Children in selected group (group mode)
    const childrenInGroup = selectedGroupId
        ? children.filter((c) => c.groupId === selectedGroupId)
        : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !description || !dueDate) {
            showModal("error", "Wypełnij wszystkie wymagane pola");
            return;
        }

        if (paymentMode === "single" && !childId) {
            showModal("error", "Wybierz dziecko");
            return;
        }

        if (paymentMode === "group" && !selectedGroupId) {
            showModal("error", "Wybierz grupę");
            return;
        }

        if (paymentMode === "group" && childrenInGroup.length === 0) {
            showModal("error", "Wybrana grupa nie ma żadnych dzieci");
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            showModal("error", "Podaj prawidłową kwotę");
            return;
        }

        setIsSubmitting(true);

        try {
            if (editingPayment) {
                // Editing existing payment - single child only
                const res = await fetch(`/api/payments/${editingPayment.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        childId,
                        amount: parsedAmount,
                        description: description.trim(),
                        dueDate,
                        status,
                    }),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || "Błąd zapisu");
                }

                showModal("success", "Płatność została zaktualizowana");
            } else if (paymentMode === "single") {
                // Create payment for single child
                const res = await fetch("/api/payments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        childId,
                        amount: parsedAmount,
                        description: description.trim(),
                        dueDate,
                        status,
                    }),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || "Błąd zapisu");
                }

                showModal("success", "Płatność została wystawiona");
            } else {
                // Create payments for all children in group
                const results = await Promise.allSettled(
                    childrenInGroup.map((child) =>
                        fetch("/api/payments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                childId: child.id,
                                amount: parsedAmount,
                                description: description.trim(),
                                dueDate,
                                status: "PENDING",
                            }),
                        })
                    )
                );

                const successful = results.filter(
                    (r) => r.status === "fulfilled"
                ).length;
                const failed = results.filter(
                    (r) => r.status === "rejected"
                ).length;

                if (failed > 0) {
                    showModal(
                        "warning",
                        `Wystawiono ${successful} płatności. ${failed} nie udało się utworzyć.`
                    );
                } else {
                    showModal(
                        "success",
                        `Wystawiono ${successful} płatności dla grupy ${groups.find((g) => g.id === selectedGroupId)?.name}`
                    );
                }
            }

            onSuccess();
        } catch (err) {
            console.error(err);
            showModal(
                "error",
                err instanceof Error ? err.message : "Wystąpił błąd podczas zapisu"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    {editingPayment ? "Edytuj płatność" : "Wystaw nową płatność"}
                </h2>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Payment mode toggle - only for new payments */}
            {!editingPayment && (
                <div className="space-y-2">
                    <Label>Tryb wystawiania</Label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={paymentMode === "single" ? "default" : "outline"}
                            onClick={() => setPaymentMode("single")}
                            className={
                                paymentMode === "single"
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : ""
                            }
                        >
                            <User className="h-4 w-4 mr-2" />
                            Pojedyncze dziecko
                        </Button>
                        <Button
                            type="button"
                            variant={paymentMode === "group" ? "default" : "outline"}
                            onClick={() => setPaymentMode("group")}
                            className={
                                paymentMode === "group"
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : ""
                            }
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Cała grupa
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Single child mode */}
                {paymentMode === "single" && !editingPayment && (
                    <>
                        {/* Group filter */}
                        <div className="space-y-2">
                            <Label htmlFor="groupFilter">Filtruj po grupie</Label>
                            <Select value={groupFilter} onValueChange={setGroupFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Wszystkie grupy" />
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

                        {/* Child selection */}
                        <div className="space-y-2">
                            <Label htmlFor="childId">
                                Dziecko <span className="text-red-500">*</span>
                            </Label>
                            <Select value={childId} onValueChange={setChildId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz dziecko" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredChildren.map((child) => (
                                        <SelectItem key={child.id} value={child.id}>
                                            {child.name} {child.surname}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}

                {/* Group mode */}
                {paymentMode === "group" && !editingPayment && (
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="selectedGroupId">
                            Grupa <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={selectedGroupId}
                            onValueChange={setSelectedGroupId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz grupę" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedGroupId && (
                            <p className="text-sm text-gray-500">
                                Płatność zostanie wystawiona dla{" "}
                                <strong>{childrenInGroup.length}</strong> dzieci w tej grupie
                            </p>
                        )}
                    </div>
                )}

                {/* Editing mode - show child info */}
                {editingPayment && (
                    <div className="space-y-2 md:col-span-2">
                        <Label>Dziecko</Label>
                        <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                            {editingPayment.child.name} {editingPayment.child.surname}
                        </div>
                    </div>
                )}

                {/* Amount */}
                <div className="space-y-2">
                    <Label htmlFor="amount">
                        Kwota (PLN) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                {/* Due date */}
                <div className="space-y-2">
                    <Label htmlFor="dueDate">
                        Termin płatności <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">
                        Opis <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="description"
                        placeholder="np. Czesne za styczeń 2025"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {/* Status (only for editing) */}
                {editingPayment && (
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={status}
                            onValueChange={(v) =>
                                setStatus(v as "PENDING" | "PAID" | "OVERDUE" | "CANCELLED")
                            }
                        >
                            <SelectTrigger>
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
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Anuluj
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {paymentMode === "group" && !editingPayment
                                ? `Wystawianie ${childrenInGroup.length} płatności...`
                                : "Zapisywanie..."}
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingPayment
                                ? "Zapisz zmiany"
                                : paymentMode === "group"
                                    ? `Wystaw dla ${childrenInGroup.length || "grupy"} dzieci`
                                    : "Wystaw płatność"}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
