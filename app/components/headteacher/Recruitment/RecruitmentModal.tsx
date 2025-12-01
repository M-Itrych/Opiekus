"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X, CheckCircle2, Clock, Mail, Phone, Calendar, User, Users, UserPlus, Copy, Check } from "lucide-react";
import { format } from "date-fns";

interface RecruitmentModalProps {
	applicationId?: string | null;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface RecruitmentApplication {
	id: string;
	childName: string;
	childSurname: string;
	childAge: number;
	parentName: string;
	parentEmail: string;
	parentPhone: string;
	parent2Name: string | null;
	parent2Email: string | null;
	parent2Phone: string | null;
	applicationDate: string;
	status: "PENDING" | "VERIFIED" | "ACCEPTED" | "REJECTED";
	birthCertificate: boolean;
	medicalExamination: boolean;
	vaccinationCard: boolean;
	photos: boolean;
	notes: string | null;
	child: {
		id: string;
		name: string;
		surname: string;
		group?: { id: string; name: string } | null;
	} | null;
}

interface AcceptResult {
	success: boolean;
	message: string;
	child: { id: string; name: string; surname: string };
	parent1: { email: string; password: string | null; created: boolean; message: string };
	parent2: { email: string; password: string | null; created: boolean; message: string } | null;
}

const statusLabels: Record<string, string> = {
	PENDING: "Oczekująca",
	VERIFIED: "Zweryfikowana",
	ACCEPTED: "Zaakceptowana",
	REJECTED: "Odrzucona",
};

const statusColors: Record<string, string> = {
	PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	VERIFIED: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
	ACCEPTED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const documentsList = [
	{ key: "birthCertificate" as const, label: "Akt urodzenia" },
	{ key: "medicalExamination" as const, label: "Badania lekarskie" },
	{ key: "vaccinationCard" as const, label: "Karta szczepień" },
	{ key: "photos" as const, label: "Zdjęcia" },
];

export function RecruitmentModal({ applicationId, isOpen, onClose, onSuccess }: RecruitmentModalProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [application, setApplication] = useState<RecruitmentApplication | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [acceptResult, setAcceptResult] = useState<AcceptResult | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const [childName, setChildName] = useState("");
	const [childSurname, setChildSurname] = useState("");
	const [childAge, setChildAge] = useState("");
	const [parentName, setParentName] = useState("");
	const [parentEmail, setParentEmail] = useState("");
	const [parentPhone, setParentPhone] = useState("");
	const [parent2Name, setParent2Name] = useState("");
	const [parent2Email, setParent2Email] = useState("");
	const [parent2Phone, setParent2Phone] = useState("");
	const [notes, setNotes] = useState("");
	const [showParent2, setShowParent2] = useState(false);

	const isCreateMode = !applicationId;

	useEffect(() => {
		if (isOpen) {
			resetForm();
			setAcceptResult(null);
			if (applicationId) {
				fetchApplication(applicationId);
			}
		} else {
			setApplication(null);
			setError(null);
			setAcceptResult(null);
		}
	}, [isOpen, applicationId]);

	const resetForm = () => {
		setChildName("");
		setChildSurname("");
		setChildAge("");
		setParentName("");
		setParentEmail("");
		setParentPhone("");
		setParent2Name("");
		setParent2Email("");
		setParent2Phone("");
		setNotes("");
		setShowParent2(false);
		setError(null);
	};

	const fetchApplication = async (id: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/recruitment");
			if (!response.ok) throw new Error("Nie udało się pobrać danych");
			
			const data: RecruitmentApplication[] = await response.json();
			const found = data.find(app => app.id === id);
			
			if (found) {
				setApplication(found);
			} else {
				throw new Error("Nie znaleziono wniosku");
			}
		} catch (err) {
			console.error(err);
			setError(err instanceof Error ? err.message : "Wystąpił błąd");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreate = async () => {
		if (!childName || !childSurname || !childAge || !parentName || !parentEmail || !parentPhone) {
			setError("Wypełnij wszystkie wymagane pola");
			return;
		}

		setIsSaving(true);
		setError(null);
		try {
			const response = await fetch("/api/recruitment", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					childName,
					childSurname,
					childAge,
					parentName,
					parentEmail,
					parentPhone,
					parent2Name: showParent2 ? parent2Name : null,
					parent2Email: showParent2 ? parent2Email : null,
					parent2Phone: showParent2 ? parent2Phone : null,
					notes: notes || null,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Nie udało się utworzyć wniosku");
			}

			onSuccess();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Nieznany błąd");
		} finally {
			setIsSaving(false);
		}
	};

	const handleVerify = async () => {
		if (!application) return;
		setIsSaving(true);
		setError(null);
		try {
			const response = await fetch(`/api/recruitment/${application.id}`, {
				method: "POST",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Nie udało się zweryfikować wniosku");
			}

			onSuccess();
			fetchApplication(application.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Nieznany błąd");
		} finally {
			setIsSaving(false);
		}
	};

	const handleAccept = async () => {
		if (!application) return;
		if (!confirm("Czy na pewno chcesz zaakceptować rekrutację?\n\nZostanie utworzone konto rodzica i dziecko w systemie.")) return;

		setIsSaving(true);
		setError(null);
		try {
			const response = await fetch(`/api/recruitment/${application.id}`, {
				method: "PUT",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Nie udało się zaakceptować wniosku");
			}

			const result: AcceptResult = await response.json();
			setAcceptResult(result);
			onSuccess();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Nieznany błąd");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!application) return;
		if (!confirm("Czy na pewno chcesz usunąć ten wniosek?")) return;

		setIsSaving(true);
		setError(null);
		try {
			const response = await fetch(`/api/recruitment/${application.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Nie udało się usunąć wniosku");
			}

			onSuccess();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Nieznany błąd");
		} finally {
			setIsSaving(false);
		}
	};

	const copyToClipboard = async (text: string, field: string) => {
		await navigator.clipboard.writeText(text);
		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 2000);
	};

	const getDocsCount = () => {
		if (!application) return 0;
		return documentsList.filter(doc => application[doc.key]).length;
	};

	if (!isOpen) return null;

	if (acceptResult) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
				<div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
					<div className="flex items-center justify-between p-6 border-b dark:border-zinc-800">
						<div>
							<h2 className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
								<CheckCircle2 className="h-6 w-6" />
								Rekrutacja zakończona!
							</h2>
							<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
								Konta zostały utworzone. Zapisz dane logowania.
							</p>
						</div>
						<Button variant="ghost" size="icon" onClick={onClose}>
							<X className="h-5 w-5" />
						</Button>
					</div>

					<div className="flex-1 overflow-y-auto p-6 space-y-6">
						<div className="border dark:border-zinc-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
							<h4 className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400 mb-2">
								<User className="h-4 w-4" />
								Dziecko dodane do systemu
							</h4>
							<p className="font-semibold text-zinc-900 dark:text-zinc-100">
								{acceptResult.child.name} {acceptResult.child.surname}
							</p>
						</div>

						<div className="border dark:border-zinc-700 rounded-lg p-4">
							<h4 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
								<Users className="h-4 w-4" />
								Rodzic 1
							</h4>
							<div className="space-y-3">
								<div>
									<Label className="text-xs text-zinc-500">Email</Label>
									<div className="flex items-center gap-2">
										<code className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded text-sm">
											{acceptResult.parent1.email}
										</code>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => copyToClipboard(acceptResult.parent1.email, 'p1email')}
										>
											{copiedField === 'p1email' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
										</Button>
									</div>
								</div>
								{acceptResult.parent1.password ? (
									<div>
										<Label className="text-xs text-zinc-500">Hasło (tymczasowe)</Label>
										<div className="flex items-center gap-2">
											<code className="flex-1 bg-amber-100 dark:bg-amber-900/30 px-3 py-2 rounded text-sm font-mono">
												{acceptResult.parent1.password}
											</code>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => copyToClipboard(acceptResult.parent1.password!, 'p1pass')}
											>
												{copiedField === 'p1pass' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
											</Button>
										</div>
									</div>
								) : (
									<p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
										{acceptResult.parent1.message}
									</p>
								)}
							</div>
						</div>

						{acceptResult.parent2 && (
							<div className="border dark:border-zinc-700 rounded-lg p-4">
								<h4 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
									<Users className="h-4 w-4" />
									Rodzic 2
								</h4>
								<div className="space-y-3">
									<div>
										<Label className="text-xs text-zinc-500">Email</Label>
										<div className="flex items-center gap-2">
											<code className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded text-sm">
												{acceptResult.parent2.email}
											</code>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => copyToClipboard(acceptResult.parent2!.email, 'p2email')}
											>
												{copiedField === 'p2email' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
											</Button>
										</div>
									</div>
									{acceptResult.parent2.password ? (
										<div>
											<Label className="text-xs text-zinc-500">Hasło (tymczasowe)</Label>
											<div className="flex items-center gap-2">
												<code className="flex-1 bg-amber-100 dark:bg-amber-900/30 px-3 py-2 rounded text-sm font-mono">
													{acceptResult.parent2.password}
												</code>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => copyToClipboard(acceptResult.parent2!.password!, 'p2pass')}
												>
													{copiedField === 'p2pass' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
												</Button>
											</div>
										</div>
									) : (
										<p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
											{acceptResult.parent2.message}
										</p>
									)}
								</div>
							</div>
						)}

						<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
							<p className="text-sm text-amber-800 dark:text-amber-200">
								⚠️ <strong>Ważne:</strong> Zapisz te dane logowania i przekaż je rodzicom. 
								Hasła są generowane automatycznie i nie będą już wyświetlane.
							</p>
						</div>
					</div>

					<div className="p-6 border-t dark:border-zinc-800 flex justify-end">
						<Button onClick={onClose} className="bg-sky-600 hover:bg-sky-500 text-white">
							Zamknij
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
				<div className="flex items-center justify-between p-6 border-b dark:border-zinc-800">
					<div>
						<h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
							{isCreateMode ? "Nowy wniosek rekrutacyjny" : "Szczegóły wniosku"}
						</h2>
						<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
							{isCreateMode ? "Wypełnij dane dziecka i rodziców" : "Weryfikuj dokumenty i zarządzaj rekrutacją"}
						</p>
					</div>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="h-5 w-5" />
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto p-6">
					{isLoading ? (
						<div className="flex justify-center py-10">
							<Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
						</div>
					) : error && !isCreateMode ? (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
							{error}
						</div>
					) : isCreateMode ? (
						<div className="space-y-6">
							{error && (
								<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
									{error}
								</div>
							)}

							<div className="border dark:border-zinc-700 rounded-lg p-4">
								<h4 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
									<User className="h-4 w-4" />
									Dane dziecka
								</h4>
								<div className="grid gap-4 md:grid-cols-2">
									<div className="grid gap-2">
										<Label htmlFor="childName">Imię dziecka *</Label>
										<Input
											id="childName"
											value={childName}
											onChange={(e) => setChildName(e.target.value)}
											placeholder="np. Jan"
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="childSurname">Nazwisko dziecka *</Label>
										<Input
											id="childSurname"
											value={childSurname}
											onChange={(e) => setChildSurname(e.target.value)}
											placeholder="np. Kowalski"
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="childAge">Wiek dziecka *</Label>
										<Input
											id="childAge"
											type="number"
											min="0"
											max="10"
											value={childAge}
											onChange={(e) => setChildAge(e.target.value)}
											placeholder="np. 3"
										/>
									</div>
								</div>
							</div>

							<div className="border dark:border-zinc-700 rounded-lg p-4">
								<h4 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
									<Users className="h-4 w-4" />
									Rodzic / Opiekun 1
								</h4>
								<div className="grid gap-4">
									<div className="grid gap-2">
										<Label htmlFor="parentName">Imię i nazwisko *</Label>
										<Input
											id="parentName"
											value={parentName}
											onChange={(e) => setParentName(e.target.value)}
											placeholder="np. Anna Kowalska"
										/>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<div className="grid gap-2">
											<Label htmlFor="parentEmail">Email *</Label>
											<Input
												id="parentEmail"
												type="email"
												value={parentEmail}
												onChange={(e) => setParentEmail(e.target.value)}
												placeholder="np. anna@email.com"
											/>
										</div>
										<div className="grid gap-2">
											<Label htmlFor="parentPhone">Telefon *</Label>
											<Input
												id="parentPhone"
												type="tel"
												value={parentPhone}
												onChange={(e) => setParentPhone(e.target.value)}
												placeholder="np. +48 123 456 789"
											/>
										</div>
									</div>
								</div>
							</div>

							{showParent2 ? (
								<div className="border dark:border-zinc-700 rounded-lg p-4">
									<div className="flex items-center justify-between mb-4">
										<h4 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
											<Users className="h-4 w-4" />
											Rodzic / Opiekun 2
										</h4>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setShowParent2(false);
												setParent2Name("");
												setParent2Email("");
												setParent2Phone("");
											}}
											className="text-red-500 hover:text-red-600"
										>
											Usuń
										</Button>
									</div>
									<div className="grid gap-4">
										<div className="grid gap-2">
											<Label htmlFor="parent2Name">Imię i nazwisko</Label>
											<Input
												id="parent2Name"
												value={parent2Name}
												onChange={(e) => setParent2Name(e.target.value)}
												placeholder="np. Jan Kowalski"
											/>
										</div>
										<div className="grid gap-4 md:grid-cols-2">
											<div className="grid gap-2">
												<Label htmlFor="parent2Email">Email</Label>
												<Input
													id="parent2Email"
													type="email"
													value={parent2Email}
													onChange={(e) => setParent2Email(e.target.value)}
													placeholder="np. jan@email.com"
												/>
											</div>
											<div className="grid gap-2">
												<Label htmlFor="parent2Phone">Telefon</Label>
												<Input
													id="parent2Phone"
													type="tel"
													value={parent2Phone}
													onChange={(e) => setParent2Phone(e.target.value)}
													placeholder="np. +48 987 654 321"
												/>
											</div>
										</div>
									</div>
								</div>
							) : (
								<Button
									variant="outline"
									onClick={() => setShowParent2(true)}
									className="w-full border-dashed"
								>
									<UserPlus className="h-4 w-4 mr-2" />
									Dodaj drugiego rodzica
								</Button>
							)}

							<div className="grid gap-2">
								<Label htmlFor="notes">Notatki (opcjonalne)</Label>
								<Textarea
									id="notes"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder="Dodatkowe informacje..."
									rows={3}
								/>
							</div>

							<div className="pt-4 flex justify-end gap-2 border-t dark:border-zinc-800">
								<Button variant="outline" onClick={onClose}>
									Anuluj
								</Button>
								<Button 
									onClick={handleCreate} 
									disabled={isSaving}
									className="bg-sky-600 hover:bg-sky-500 text-white"
								>
									{isSaving ? "Tworzenie..." : "Utwórz wniosek"}
								</Button>
							</div>
						</div>
					) : application ? (
						<div className="space-y-6">
							{error && (
								<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
									{error}
								</div>
							)}

							<div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
								<div>
									<h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
										{application.childName} {application.childSurname}
									</h3>
									<p className="text-sm text-zinc-500 dark:text-zinc-400">
										Wiek: {application.childAge} lat
									</p>
								</div>
								<span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[application.status]}`}>
									{statusLabels[application.status]}
								</span>
							</div>

							<div className="border dark:border-zinc-700 rounded-lg p-4">
								<h4 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
									<Users className="h-4 w-4" />
									Rodzic 1
								</h4>
								<div className="space-y-2 text-sm">
									<p className="font-medium text-zinc-900 dark:text-zinc-100">
										{application.parentName}
									</p>
									<div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
										<Mail className="h-4 w-4" />
										{application.parentEmail}
									</div>
									<div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
										<Phone className="h-4 w-4" />
										{application.parentPhone}
									</div>
								</div>
							</div>

							{application.parent2Name && (
								<div className="border dark:border-zinc-700 rounded-lg p-4">
									<h4 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
										<Users className="h-4 w-4" />
										Rodzic 2
									</h4>
									<div className="space-y-2 text-sm">
										<p className="font-medium text-zinc-900 dark:text-zinc-100">
											{application.parent2Name}
										</p>
										{application.parent2Email && (
											<div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
												<Mail className="h-4 w-4" />
												{application.parent2Email}
											</div>
										)}
										{application.parent2Phone && (
											<div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
												<Phone className="h-4 w-4" />
												{application.parent2Phone}
											</div>
										)}
									</div>
								</div>
							)}

							<div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
								<Calendar className="h-4 w-4" />
								Data wniosku: {format(new Date(application.applicationDate), "dd.MM.yyyy")}
							</div>

							<div className="border dark:border-zinc-700 rounded-lg">
								<div className="bg-zinc-50 dark:bg-zinc-800 p-3 border-b dark:border-zinc-700">
									<h4 className="text-sm font-medium">
										Dokumenty ({getDocsCount()}/4)
									</h4>
								</div>
								<div className="p-3 space-y-2">
									{documentsList.map((doc) => (
										<div
											key={doc.key}
											className={`flex items-center justify-between p-2 rounded-md text-sm ${
												application[doc.key]
													? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
													: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
											}`}
										>
											<span>{doc.label}</span>
											{application[doc.key] ? (
												<CheckCircle2 className="h-4 w-4" />
											) : (
												<Clock className="h-4 w-4" />
											)}
										</div>
									))}
								</div>
							</div>

							{application.notes && (
								<div className="border dark:border-zinc-700 rounded-lg p-4">
									<h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
										Notatki
									</h4>
									<p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
										{application.notes}
									</p>
								</div>
							)}

							{application.child && (
								<div className="border dark:border-zinc-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
									<h4 className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400 mb-2">
										<User className="h-4 w-4" />
										Dziecko w systemie
									</h4>
									<p className="text-sm text-zinc-900 dark:text-zinc-100">
										{application.child.name} {application.child.surname}
										{application.child.group && (
											<span className="text-zinc-500 dark:text-zinc-400">
												{" "}— Grupa: {application.child.group.name}
											</span>
										)}
									</p>
								</div>
							)}

							<div className="pt-4 flex justify-end gap-2 border-t dark:border-zinc-800">
								<Button variant="outline" onClick={onClose}>
									Zamknij
								</Button>
								{application.status === "PENDING" && (
									<Button 
										onClick={handleVerify} 
										disabled={isSaving}
										className="bg-sky-600 hover:bg-sky-500 text-white"
									>
										{isSaving ? "Weryfikowanie..." : "Zweryfikuj dokumenty"}
									</Button>
								)}
								{application.status === "VERIFIED" && (
									<Button 
										onClick={handleAccept} 
										disabled={isSaving}
										className="bg-green-600 hover:bg-green-500 text-white"
									>
										{isSaving ? "Akceptowanie..." : "Zaakceptuj i utwórz konta"}
									</Button>
								)}
								{application.status !== "ACCEPTED" && (
									<Button
										variant="outline"
										onClick={handleDelete}
										disabled={isSaving}
										className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
									>
										Usuń
									</Button>
								)}
							</div>
						</div>
					) : (
						<div className="py-10 text-center text-sm text-zinc-500">
							Wybierz wniosek do wyświetlenia
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
