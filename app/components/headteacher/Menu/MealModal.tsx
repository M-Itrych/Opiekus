"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { X, Utensils, Coffee, Cookie, Loader2, Trash2, AlertTriangle, Leaf, Wheat, Milk, Sparkles } from "lucide-react";
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
	diet?: string;
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

const DIET_TYPES = [
	{ value: "STANDARD", label: "Standardowa", icon: Sparkles, color: "border-zinc-300 bg-zinc-50 text-zinc-700" },
	{ value: "VEGETARIAN", label: "Wegetariańska", icon: Leaf, color: "border-green-300 bg-green-50 text-green-700" },
	{ value: "VEGAN", label: "Wegańska", icon: Leaf, color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
	{ value: "GLUTEN_FREE", label: "Bezglutenowa", icon: Wheat, color: "border-amber-300 bg-amber-50 text-amber-700" },
	{ value: "LACTOSE_FREE", label: "Bez laktozy", icon: Milk, color: "border-blue-300 bg-blue-50 text-blue-700" },
	{ value: "CUSTOM", label: "Inna", icon: Sparkles, color: "border-purple-300 bg-purple-50 text-purple-700" },
];

export function MealModal({ isOpen, onClose, onSuccess, date, meal }: MealModalProps) {
	const [mealType, setMealType] = useState("LUNCH");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [allergens, setAllergens] = useState<string[]>([]);
	const [diet, setDiet] = useState("STANDARD");
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [warning, setWarning] = useState<string | null>(null);

	const isEditMode = !!meal;

	useEffect(() => {
		if (meal) {
			setMealType(meal.mealType);
			setName(meal.name);
			setDescription(meal.description || "");
			setAllergens(meal.allergens || []);
			setDiet(meal.diet || "STANDARD");
		} else {
			setMealType("LUNCH");
			setName("");
			setDescription("");
			setAllergens([]);
			setDiet("STANDARD");
		}
		setError(null);
		setWarning(null);
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
		setWarning(null);

		try {
			const payload = {
				date: date.toISOString(),
				mealType,
				name: name.trim(),
				description: description.trim() || null,
				allergens,
				diet,
			};

			const url = isEditMode ? `/api/menu/${meal.id}` : "/api/menu";
			const method = isEditMode ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await response.json();

			// Check for diet conflict warning
			if (data.warning && data.dietsInGroup) {
				setWarning(data.warning);
				setIsSaving(false);
				return;
			}

			if (!response.ok) {
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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
			<div className="bg-white dark:bg-zinc-900 rounded-lg sm:rounded-xl shadow-xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 p-4 sm:p-6 border-b dark:border-zinc-800">
					<div className="min-w-0 flex-1">
						<h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
							{isEditMode ? "Edytuj posiłek" : "Dodaj posiłek"}
						</h2>
						{date && (
							<p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
								{format(date, "EEEE, d MMMM yyyy", { locale: pl })}
							</p>
						)}
					</div>
					<Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
						<X className="h-4 w-4 sm:h-5 sm:w-5" />
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto p-4 sm:p-6">
					<div className="space-y-4 sm:space-y-6">
						{error && (
							<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
								<AlertTriangle className="h-4 w-4 shrink-0" />
								{error}
							</div>
						)}

						{warning && (
							<div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
								<AlertTriangle className="h-4 w-4 shrink-0" />
								<div>
									<p>{warning}</p>
									<p className="text-xs mt-1">Kliknij ponownie aby zapisać mimo ostrzeżenia.</p>
								</div>
							</div>
						)}

						<div className="space-y-2">
							<Label className="text-xs sm:text-sm">Typ posiłku</Label>
							<div className="grid grid-cols-3 gap-2">
								{MEAL_TYPES.map(({ value, label, icon: Icon, color }) => (
									<button
										key={value}
										type="button"
										onClick={() => setMealType(value)}
										className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 transition-all ${
											mealType === value
												? color + " border-2"
												: "border-zinc-200 hover:border-zinc-300 text-zinc-600"
										}`}
									>
										<Icon className="h-4 w-4 sm:h-5 sm:w-5" />
										<span className="text-xs sm:text-sm font-medium text-center">{label}</span>
									</button>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-xs sm:text-sm">Dieta</Label>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
								{DIET_TYPES.map(({ value, label, icon: Icon, color }) => (
									<button
										key={value}
										type="button"
										onClick={() => setDiet(value)}
										className={`flex items-center gap-1.5 sm:gap-2 p-2 rounded-lg border-2 transition-all text-left ${
											diet === value
												? color + " border-2"
												: "border-zinc-200 hover:border-zinc-300 text-zinc-600"
										}`}
									>
										<Icon className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
										<span className="text-[10px] sm:text-xs font-medium break-words">{label}</span>
									</button>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name" className="text-xs sm:text-sm">Nazwa posiłku *</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="np. Zupa pomidorowa z makaronem"
								className="text-xs sm:text-sm"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description" className="text-xs sm:text-sm">Opis (opcjonalnie)</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Dodatkowe informacje o posiłku..."
								rows={3}
								className="text-xs sm:text-sm"
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-xs sm:text-sm">Alergeny</Label>
							<div className="flex flex-wrap gap-2">
								{COMMON_ALLERGENS.map((allergen) => (
									<button
										key={allergen}
										type="button"
										onClick={() => toggleAllergen(allergen)}
										className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all ${
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
								<p className="text-xs text-zinc-500 mt-2 break-words">
									Wybrane: {allergens.join(", ")}
								</p>
							)}
						</div>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 p-4 sm:p-6 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
					<div>
						{isEditMode && (
							<Button
								variant="outline"
								onClick={handleDelete}
								disabled={isDeleting || isSaving}
								className="text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
							>
								{isDeleting ? (
									<Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
								) : (
									<Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
								)}
								Usuń
							</Button>
						)}
					</div>
					<div className="flex items-center gap-2 w-full sm:w-auto">
						<Button variant="outline" onClick={onClose} disabled={isSaving || isDeleting} className="text-xs sm:text-sm flex-1 sm:flex-initial">
							Anuluj
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={isSaving || isDeleting}
							className="bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm flex-1 sm:flex-initial"
						>
							{isSaving ? (
								<>
									<Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
									<span className="hidden sm:inline">Zapisywanie...</span>
									<span className="sm:hidden">Zapisywanie</span>
								</>
							) : isEditMode ? (
								<>
									<span className="hidden sm:inline">Zapisz zmiany</span>
									<span className="sm:hidden">Zapisz</span>
								</>
							) : (
								<>
									<span className="hidden sm:inline">Dodaj posiłek</span>
									<span className="sm:hidden">Dodaj</span>
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

