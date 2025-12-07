"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { X, Utensils, Coffee, Cookie, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MealPlan {
	id: string;
	date: string;
	mealType: string;
	name: string;
	description: string | null;
	allergens: string[];
	groupId: string | null;
	group?: {
		id: string;
		name: string;
	} | null;
}

interface MealModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	date: Date | null;
	meal: MealPlan | null;
}

const MEAL_TYPES = [
	{ value: "BREAKFAST", label: "Śniadanie", icon: Coffee, color: "border-amber-300 bg-amber-50 text-amber-700" },
	{ value: "LUNCH", label: "Obiad", icon: Utensils, color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
	{ value: "SNACK", label: "Podwieczorek", icon: Cookie, color: "border-sky-300 bg-sky-50 text-sky-700" },
];

const COMMON_ALLERGENS = [
	"Gluten",
	"Mleko",
	"Jaja",
	"Orzechy",
	"Soja",
	"Ryby",
	"Seler",
	"Gorczyca",
	"Sezam",
];

export function MealModal({ isOpen, onClose, onSuccess, date, meal }: MealModalProps) {
	const [mealType, setMealType] = useState("LUNCH");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [allergens, setAllergens] = useState<string[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isEditMode = !!meal;

	useEffect(() => {
		if (meal) {
			setMealType(meal.mealType);
			setName(meal.name);
			setDescription(meal.description || "");
			setAllergens(meal.allergens || []);
		} else {
			setMealType("LUNCH");
			setName("");
			setDescription("");
			setAllergens([]);
		}
		setError(null);
	}, [meal, isOpen]);

	const toggleAllergen = (allergen: string) => {
		setAllergens((prev) =>
			prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
		);
	};

	const handleSubmit = async () => {
		if (!name.trim()) {
			setError("Nazwa posiłku jest wymagana");
			return;
		}

		if (!date) {
			setError("Data jest wymagana");
			return;
		}

		setIsSaving(true);
		setError(null);

		try {
			const payload = {
				date: date.toISOString(),
				mealType,
				name: name.trim(),
				description: description.trim() || null,
				allergens,
			};

			const url = isEditMode ? `/api/menu/${meal.id}` : "/api/menu";
			const method = isEditMode ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Wystąpił błąd");
			}

			onSuccess();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Wystąpił błąd");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!meal) return;

		setIsDeleting(true);
		setError(null);

		try {
			const response = await fetch(`/api/menu/${meal.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Wystąpił błąd");
			}

			onSuccess();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Wystąpił błąd");
		} finally {
			setIsDeleting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
				<div className="flex items-center justify-between p-6 border-b dark:border-zinc-800">
					<div>
						<h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
							{isEditMode ? "Edytuj posiłek" : "Dodaj posiłek"}
						</h2>
						{date && (
							<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
								{format(date, "EEEE, d MMMM yyyy", { locale: pl })}
							</p>
						)}
					</div>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="h-5 w-5" />
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto p-6">
					<div className="space-y-6">
						{error && (
							<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
								<AlertTriangle className="h-4 w-4 shrink-0" />
								{error}
							</div>
						)}

						<div className="space-y-2">
							<Label>Typ posiłku</Label>
							<div className="grid grid-cols-3 gap-2">
								{MEAL_TYPES.map(({ value, label, icon: Icon, color }) => (
									<button
										key={value}
										type="button"
										onClick={() => setMealType(value)}
										className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
											mealType === value
												? color + " border-2"
												: "border-zinc-200 hover:border-zinc-300 text-zinc-600"
										}`}
									>
										<Icon className="h-5 w-5" />
										<span className="text-sm font-medium">{label}</span>
									</button>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">Nazwa posiłku *</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="np. Zupa pomidorowa z makaronem"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Opis (opcjonalnie)</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Dodatkowe informacje o posiłku..."
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<Label>Alergeny</Label>
							<div className="flex flex-wrap gap-2">
								{COMMON_ALLERGENS.map((allergen) => (
									<button
										key={allergen}
										type="button"
										onClick={() => toggleAllergen(allergen)}
										className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
											allergens.includes(allergen)
												? "bg-red-100 text-red-700 border-red-300"
												: "bg-zinc-100 text-zinc-600 border-zinc-200 hover:border-zinc-300"
										}`}
									>
										{allergen}
									</button>
								))}
							</div>
							{allergens.length > 0 && (
								<p className="text-xs text-zinc-500 mt-2">
									Wybrane: {allergens.join(", ")}
								</p>
							)}
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between p-6 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
					<div>
						{isEditMode && (
							<Button
								variant="outline"
								onClick={handleDelete}
								disabled={isDeleting || isSaving}
								className="text-red-600 hover:text-red-700 hover:bg-red-50"
							>
								{isDeleting ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : (
									<Trash2 className="h-4 w-4 mr-2" />
								)}
								Usuń
							</Button>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={onClose} disabled={isSaving || isDeleting}>
							Anuluj
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={isSaving || isDeleting}
							className="bg-sky-600 hover:bg-sky-500 text-white"
						>
							{isSaving ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
									Zapisywanie...
								</>
							) : isEditMode ? (
								"Zapisz zmiany"
							) : (
								"Dodaj posiłek"
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

