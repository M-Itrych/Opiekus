"use client";

import { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Utensils, Coffee, Cookie, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MealModal } from "./MealModal";

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

interface MealsByDay {
	[key: string]: MealPlan[];
}

const MEAL_TYPES = {
	BREAKFAST: { label: "Śniadanie", icon: Coffee, color: "bg-amber-100 text-amber-700 border-amber-200" },
	LUNCH: { label: "Obiad", icon: Utensils, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
	SNACK: { label: "Podwieczorek", icon: Cookie, color: "bg-sky-100 text-sky-700 border-sky-200" },
};

const WEEKDAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

export function MenuCalendar() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [meals, setMeals] = useState<MealPlan[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

	const toggleDayExpanded = (dateKey: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setExpandedDays((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(dateKey)) {
				newSet.delete(dateKey);
			} else {
				newSet.add(dateKey);
			}
			return newSet;
		});
	};

	useEffect(() => {
		const fetchMeals = async () => {
			setIsLoading(true);
			try {
				const month = currentDate.getMonth() + 1;
				const year = currentDate.getFullYear();
				const response = await fetch(`/api/menu?month=${month}&year=${year}`);
				if (response.ok) {
					const data = await response.json();
					setMeals(data);
				}
			} catch (error) {
				console.error("Error fetching meals:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchMeals();
	}, [currentDate]);

	const refetchMeals = async () => {
		setIsLoading(true);
		try {
			const month = currentDate.getMonth() + 1;
			const year = currentDate.getFullYear();
			const response = await fetch(`/api/menu?month=${month}&year=${year}`);
			if (response.ok) {
				const data = await response.json();
				setMeals(data);
			}
		} catch (error) {
			console.error("Error fetching meals:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const mealsByDay = useMemo(() => {
		const grouped: MealsByDay = {};
		meals.forEach((meal) => {
			const dateKey = format(new Date(meal.date), "yyyy-MM-dd");
			if (!grouped[dateKey]) {
				grouped[dateKey] = [];
			}
			grouped[dateKey].push(meal);
		});
		return grouped;
	}, [meals]);

	const calendarDays = useMemo(() => {
		const start = startOfMonth(currentDate);
		const end = endOfMonth(currentDate);
		const days = eachDayOfInterval({ start, end });

		// Dodaj puste dni na początku tygodnia (poniedziałek = 0)
		const startDay = getDay(start);
		const paddingStart = startDay === 0 ? 6 : startDay - 1;
		const padding = Array(paddingStart).fill(null);

		return [...padding, ...days];
	}, [currentDate]);

	const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
	const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

	const handleDayClick = (day: Date) => {
		setSelectedDate(day);
		setSelectedMeal(null);
		setIsModalOpen(true);
	};

	const handleMealClick = (meal: MealPlan, e: React.MouseEvent) => {
		e.stopPropagation();
		setSelectedMeal(meal);
		setSelectedDate(new Date(meal.date));
		setIsModalOpen(true);
	};

	const handleModalClose = () => {
		setIsModalOpen(false);
		setSelectedDate(null);
		setSelectedMeal(null);
	};

	const handleMealSaved = () => {
		refetchMeals();
		handleModalClose();
	};

	const getMealIcon = (mealType: string) => {
		const type = MEAL_TYPES[mealType as keyof typeof MEAL_TYPES];
		if (!type) return Utensils;
		return type.icon;
	};

	const getMealStyle = (mealType: string) => {
		const type = MEAL_TYPES[mealType as keyof typeof MEAL_TYPES];
		if (!type) return "bg-gray-100 text-gray-700 border-gray-200";
		return type.color;
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Header z nawigacją */}
			<div className="flex items-center gap-4">
				<Button variant="outline" size="icon" onClick={handlePrevMonth}>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<h2 className="text-xl font-semibold text-zinc-900 min-w-[200px] text-center">
					{format(currentDate, "LLLL yyyy", { locale: pl })}
				</h2>
				<Button variant="outline" size="icon" onClick={handleNextMonth}>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>

			{/* Legenda */}
			<div className="flex items-center gap-4 flex-wrap">
				{Object.entries(MEAL_TYPES).map(([key, { label, icon: Icon, color }]) => (
					<div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${color}`}>
						<Icon className="h-4 w-4" />
						<span className="text-sm font-medium">{label}</span>
					</div>
				))}
			</div>

			{/* Kalendarz */}
			{isLoading ? (
				<div className="flex items-center justify-center py-20">
					<Loader2 className="h-8 w-8 animate-spin text-sky-500" />
				</div>
			) : (
				<div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
					{/* Nagłówki dni tygodnia */}
					<div className="grid grid-cols-7 bg-zinc-50 border-b border-zinc-200">
						{WEEKDAYS.map((day) => (
							<div key={day} className="py-3 text-center text-sm font-medium text-zinc-600">
								{day}
							</div>
						))}
					</div>

					{/* Dni kalendarza */}
					<div className="grid grid-cols-7">
						{calendarDays.map((day, index) => {
							if (!day) {
								return <div key={`empty-${index}`} className="min-h-[120px] bg-zinc-50/50 border-b border-r border-zinc-100" />;
							}

							const dateKey = format(day, "yyyy-MM-dd");
							const dayMeals = mealsByDay[dateKey] || [];
							const isToday = isSameDay(day, new Date());
							const isCurrentMonth = isSameMonth(day, currentDate);
							const isExpanded = expandedDays.has(dateKey);
							const hasMultipleMeals = dayMeals.length > 1;
							const visibleMeals = isExpanded ? dayMeals : dayMeals.slice(0, 1);

							return (
								<div
									key={dateKey}
									onClick={() => handleDayClick(day)}
									className={`min-h-[120px] p-2 border-b border-r border-zinc-100 cursor-pointer transition-colors hover:bg-sky-50/50 ${
										!isCurrentMonth ? "bg-zinc-50/50" : ""
									} ${isExpanded ? "bg-sky-50/30" : ""}`}
								>
									<div className="flex items-center justify-between mb-2">
										<span
											className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
												isToday
													? "bg-sky-500 text-white"
													: isCurrentMonth
													? "text-zinc-900"
													: "text-zinc-400"
											}`}
										>
											{format(day, "d")}
										</span>
										{dayMeals.length > 0 && (
											<span className="text-xs text-zinc-400">
												{dayMeals.length} {dayMeals.length === 1 ? "posiłek" : dayMeals.length < 5 ? "posiłki" : "posiłków"}
											</span>
										)}
									</div>

									<div className="flex flex-col gap-1">
										{visibleMeals.map((meal) => {
											const Icon = getMealIcon(meal.mealType);
											return (
												<div
													key={meal.id}
													onClick={(e) => handleMealClick(meal, e)}
													className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border truncate hover:opacity-80 transition-opacity ${getMealStyle(meal.mealType)}`}
												>
													<Icon className="h-3 w-3 shrink-0" />
													<span className="truncate">{meal.name}</span>
												</div>
											);
										})}
										{hasMultipleMeals && (
											<button
												onClick={(e) => toggleDayExpanded(dateKey, e)}
												className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 pl-1 py-0.5 transition-colors"
											>
												{isExpanded ? (
													<>
														<ChevronUp className="h-3 w-3" />
														<span>Zwiń</span>
													</>
												) : (
													<>
														<ChevronDown className="h-3 w-3" />
														<span>+{dayMeals.length - 1} więcej</span>
													</>
												)}
											</button>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Modal */}
			<MealModal
				isOpen={isModalOpen}
				onClose={handleModalClose}
				onSuccess={handleMealSaved}
				date={selectedDate}
				meal={selectedMeal}
			/>
		</div>
	);
}

