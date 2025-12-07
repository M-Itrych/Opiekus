"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Search,
	Plus,
	FileText,
	Calendar,
	Loader2,
	Download,
	Archive,
	Trash2,
	ExternalLink,
	Upload,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, X } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useUploadThing } from "@/lib/uploadthing";

type Status = "AKTYWNY" | "ARCHIWALNY";

interface DocumentRecord {
	id: string;
	title: string;
	description: string | null;
	fileUrl: string;
	status: Status;
	createdAt: string;
	updatedAt: string;
}

interface DocumentFormState {
	title: string;
	description: string;
	fileUrl: string;
	status: Status;
}

const statusLabels: Record<Status, string> = {
	AKTYWNY: "Aktywny",
	ARCHIWALNY: "Archiwalny",
};

const statusColors: Record<Status, string> = {
	AKTYWNY: "bg-emerald-100 text-emerald-700",
	ARCHIWALNY: "bg-zinc-100 text-zinc-600",
};

const defaultFormState: DocumentFormState = {
	title: "",
	description: "",
	fileUrl: "",
	status: "AKTYWNY",
};

function formatDate(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pl-PL");
}

export default function DocumentsList() {
	const [documents, setDocuments] = useState<DocumentRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [formState, setFormState] = useState<DocumentFormState>(defaultFormState);
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const { startUpload } = useUploadThing("documentUploader", {
		onClientUploadComplete: (res) => {
			if (res && res.length > 0) {
				const file = res[0];
				const uploadedUrl = file.url || `https://utfs.io/f/${file.key}`;
				setFormState((prev) => ({ ...prev, fileUrl: uploadedUrl }));
			}
			setIsUploading(false);
			setUploadProgress(0);
		},
		onUploadError: (error) => {
			console.error("Upload error:", error);
			setFormError(`Błąd przesyłania: ${error.message}`);
			setIsUploading(false);
			setUploadProgress(0);
		},
		onUploadProgress: (progress) => {
			setUploadProgress(progress);
		},
		onUploadBegin: () => {
			setIsUploading(true);
			setFormError(null);
		},
	});

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			await startUpload([file]);
		} catch (err) {
			console.error("Upload error:", err);
			setIsUploading(false);
		}

		e.target.value = "";
	};

	const fetchDocuments = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch("/api/documents", { cache: "no-store" });
			if (!response.ok) throw new Error("Błąd pobierania dokumentów");
			const data: DocumentRecord[] = await response.json();
			setDocuments(data);
		} catch (err) {
			console.error(err);
			setError("Nie udało się pobrać dokumentów. Spróbuj ponownie.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDocuments();
	}, [fetchDocuments]);

	const filteredDocuments = useMemo(() => {
		return documents.filter((doc) => {
			const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus =
				selectedStatus === "all" || doc.status.toLowerCase() === selectedStatus.toLowerCase();
			return matchesSearch && matchesStatus;
		});
	}, [documents, searchQuery, selectedStatus]);

	const activeDocuments = useMemo(
		() => documents.filter((doc) => doc.status === "AKTYWNY"),
		[documents]
	);

	const openModal = (doc?: DocumentRecord) => {
		if (doc) {
			setEditingId(doc.id);
			setFormState({
				title: doc.title,
				description: doc.description || "",
				fileUrl: doc.fileUrl,
				status: doc.status,
			});
		} else {
			setEditingId(null);
			setFormState(defaultFormState);
		}
		setFormError(null);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		if (submitting) return;
		setIsModalOpen(false);
		setEditingId(null);
	};

	const handleInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = event.target;
		setFormState((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!formState.title.trim()) {
			setFormError("Uzupełnij tytuł dokumentu.");
			return;
		}
		if (!formState.fileUrl.trim()) {
			setFormError("Prześlij plik dokumentu.");
			return;
		}
		if (isUploading) {
			setFormError("Poczekaj na zakończenie przesyłania pliku.");
			return;
		}

		setFormError(null);
		setSubmitting(true);

		try {
			const url = editingId ? `/api/documents/${editingId}` : "/api/documents";
			const method = editingId ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formState),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error || "Nie udało się zapisać dokumentu");
			}

			setIsModalOpen(false);
			setEditingId(null);
			await fetchDocuments();
		} catch (err) {
			console.error(err);
			setFormError(err instanceof Error ? err.message : "Nieznany błąd");
		} finally {
			setSubmitting(false);
		}
	};

	const handleArchive = async (id: string) => {
		try {
			const response = await fetch(`/api/documents/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "ARCHIWALNY" }),
			});

			if (!response.ok) throw new Error("Nie udało się zarchiwizować dokumentu");
			await fetchDocuments();
		} catch (err) {
			console.error(err);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Czy na pewno chcesz usunąć ten dokument?")) return;

		try {
			const response = await fetch(`/api/documents/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) throw new Error("Nie udało się usunąć dokumentu");
			await fetchDocuments();
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-zinc-900">Aktywne dokumenty</h2>
						<p className="text-sm text-zinc-500">
							Najważniejsze dokumenty wymagające uwagi.
						</p>
					</div>
				</div>
				{activeDocuments.length === 0 ? (
					<div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 py-10 text-sm text-zinc-500">
						Brak aktywnych dokumentów.
					</div>
				) : (
					<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
						{activeDocuments.slice(0, 6).map((doc) => (
							<div
								key={doc.id}
								className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-sky-50/60 p-4"
							>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
										<FileText className="h-5 w-5" />
										{doc.title}
									</div>
									<a
										href={doc.fileUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sky-600 hover:text-sky-800"
									>
										<ExternalLink className="h-4 w-4" />
									</a>
								</div>
								{doc.description && (
									<p className="text-sm text-sky-900/80 line-clamp-2">{doc.description}</p>
								)}
								<div className="flex items-center gap-2 text-xs text-sky-900/70">
									<Calendar className="h-4 w-4" />
									Dodano: {formatDate(doc.createdAt)}
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			<section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold text-zinc-900">Zarządzanie dokumentami</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Dodawanie, edycja i archiwizacja dokumentów.
            </p>
          </div>
          <Button className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white" onClick={() => openModal()}>
            <Plus className="h-4 w-4" />
            Nowy dokument
          </Button>
        </div>

				<div className="mt-4 flex flex-wrap gap-4">
					<div className="relative flex-1 min-w-[200px]">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
						<Input
							type="text"
							placeholder="Szukaj dokumentów..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="flex items-center gap-2">
								Status: {selectedStatus === "all" ? "Wszystkie" : statusLabels[selectedStatus.toUpperCase() as Status] ?? selectedStatus}
								<ChevronDown className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onSelect={() => setSelectedStatus("all")}>
								Wszystkie
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => setSelectedStatus("aktywny")}>
								Aktywne
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => setSelectedStatus("archiwalny")}>
								Archiwalne
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{error && (
					<div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
						{error}
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center py-12 text-zinc-500">
						<Loader2 className="mr-2 h-5 w-5 animate-spin" />
						Ładowanie dokumentów...
					</div>
				) : filteredDocuments.length === 0 ? (
					<div className="mt-6 rounded-xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-500">
						Brak dokumentów spełniających kryteria wyszukiwania.
					</div>
				) : (
					<div className="mt-6 grid grid-cols-1 gap-4">
						{filteredDocuments.map((doc) => (
							<div
								key={doc.id}
								className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
							>
								<div className="mt-1">
									<FileText className="h-5 w-5 text-zinc-400" />
								</div>
								<div className="flex-1">
									<div className="flex items-start justify-between gap-4">
										<div>
											<h4 className="font-semibold text-zinc-900">{doc.title}</h4>
											{doc.description && (
												<p className="mt-1 text-sm text-zinc-600">{doc.description}</p>
											)}
										</div>
										<span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[doc.status]}`}>
											{statusLabels[doc.status]}
										</span>
									</div>
									<div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-600">
										<span className="flex items-center gap-1">
											<Calendar className="h-4 w-4" />
											Dodano: {formatDate(doc.createdAt)}
										</span>
										<div className="ml-auto flex items-center gap-2">
											<a
												href={doc.fileUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1 text-sky-600 hover:text-sky-800"
											>
												<Download className="h-4 w-4" />
												Pobierz
											</a>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => openModal(doc)}
												className="text-zinc-600 hover:text-zinc-900"
											>
												Edytuj
											</Button>
											{doc.status === "AKTYWNY" && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleArchive(doc.id)}
													className="text-amber-600 hover:text-amber-800"
												>
													<Archive className="h-4 w-4 mr-1" />
													Archiwizuj
												</Button>
											)}
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDelete(doc.id)}
												className="text-red-600 hover:text-red-800"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
					<div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
						<div className="flex items-center justify-between border-b px-6 py-4">
							<div>
								<h3 className="text-lg font-semibold text-zinc-900">
									{editingId ? "Edytuj dokument" : "Dodaj nowy dokument"}
								</h3>
								<p className="text-sm text-zinc-500">
									Uzupełnij szczegóły dokumentu.
								</p>
							</div>
							<button
								aria-label="Zamknij"
								onClick={closeModal}
								className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 cursor-pointer"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
							<div>
								<label className="text-sm font-medium text-zinc-700">Tytuł dokumentu</label>
								<Input
									name="title"
									value={formState.title}
									onChange={handleInputChange}
									placeholder="Np. Regulamin przedszkola"
									required
								/>
							</div>

							<div>
								<label className="text-sm font-medium text-zinc-700">Opis (opcjonalnie)</label>
								<Textarea
									name="description"
									value={formState.description}
									onChange={handleInputChange}
									rows={3}
									placeholder="Opisz dokument..."
								/>
							</div>

						<div className="space-y-3">
							<label className="text-sm font-medium text-zinc-700">Plik dokumentu</label>
							{formState.fileUrl ? (
								<div className="flex items-center gap-3 p-3 border rounded-lg bg-emerald-50 border-emerald-200">
									<FileText className="h-5 w-5 text-emerald-600" />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-emerald-800 truncate">
											Plik przesłany
										</p>
										<a
											href={formState.fileUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-emerald-600 hover:underline truncate block"
										>
											{formState.fileUrl}
										</a>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setFormState((prev) => ({ ...prev, fileUrl: "" }))}
										className="text-red-500 hover:text-red-700"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							) : (
								<div className="space-y-2">
									<input
										type="file"
										accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
										id="document-upload"
										className="hidden"
										disabled={isUploading}
										onChange={handleFileSelect}
									/>
									<Button
										type="button"
										variant="outline"
										className="w-full"
										disabled={isUploading}
										onClick={() => document.getElementById("document-upload")?.click()}
									>
										{isUploading ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Przesyłanie... {uploadProgress}%
											</>
										) : (
											<>
												<Upload className="h-4 w-4 mr-2" />
												Wybierz plik
											</>
										)}
									</Button>
									<p className="text-xs text-zinc-500">
										Obsługiwane formaty: PDF, DOC, DOCX, XLS, XLSX, TXT (max 16MB)
									</p>
								</div>
							)}
						</div>

							{editingId && (
								<div>
									<label className="text-sm font-medium text-zinc-700">Status</label>
									<Select
										value={formState.status}
										onValueChange={(value) =>
											setFormState((prev) => ({ ...prev, status: value as Status }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="AKTYWNY">Aktywny</SelectItem>
											<SelectItem value="ARCHIWALNY">Archiwalny</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}

							{formError && (
								<p className="text-sm text-red-600">{formError}</p>
							)}

              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={submitting} className="bg-sky-500 hover:bg-sky-600 text-white">
                  {submitting ? "Zapisywanie..." : editingId ? "Zapisz zmiany" : "Dodaj dokument"}
                </Button>
              </div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

