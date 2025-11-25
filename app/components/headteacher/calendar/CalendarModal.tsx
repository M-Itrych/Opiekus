"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface CalendarModalProps {
	onEventCreated?: () => void | Promise<void>
}

interface EventFormData {
	title: string
	description: string
	date: string
	startTime: string
	endTime: string
	location: string
	category: string
}

export function CalendarModal({ onEventCreated }: CalendarModalProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [formData, setFormData] = useState<EventFormData>({
		title: "",
		description: "",
		date: "",
		startTime: "",
		endTime: "",
		location: "",
		category: "inne"
	})
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (isSubmitting) return
		setIsSubmitting(true)

		const categoryMap: Record<string, string> = {
			"festiwal": "FESTIWAL",
			"wycieczka": "WYCIECZKA",
			"urodziny": "URODZINY",
			"przedstawienie": "PRZEDSTAWIENIE",
			"zajęcia": "ZAJECIA",
			"inne": "INNE"
		};

		const eventDate = new Date(`${formData.date}T${formData.startTime}`);

		const payload = {
			title: formData.title,
			content: formData.description || formData.title,
			category: categoryMap[formData.category] || "INNE",
			eventDate: eventDate.toISOString(),
			location: formData.location,
			isImportant: false
		};

		try {
			const response = await fetch("/api/announcements", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(payload)
			})

			if (!response.ok) {
				throw new Error("Failed to create event")
			}

			const data = await response.json()
			console.log("Wydarzenie dodane:", data)

			setFormData({
				title: "",
				description: "",
				date: "",
				startTime: "",
				endTime: "",
				location: "",
				category: "inne"
			})
			setIsOpen(false)
			await onEventCreated?.()
			alert("Wydarzenie zostało dodane!")
		} catch (error) {
			console.error("Error adding event:", error)
			alert("Wystąpił błąd podczas dodawania wydarzenia.")
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value
		}))
	}

	const handleCategoryChange = (value: string) => {
		setFormData(prev => ({
			...prev,
			category: value
		}))
	}

	if (!isOpen) {
		return (
			<Button
				onClick={() => setIsOpen(true)}
				className="bg-sky-500 text-white px-4 py-2 hover:bg-sky-600 transition-colors flex items-center gap-2 shadow-sm"
			>
				<PlusIcon className="h-4 w-4" />
				Dodaj wydarzenie
			</Button>
		)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
				<div className="p-6">
					<div className="mb-6">
						<h2 className="text-2xl font-bold text-zinc-900">Dodaj nowe wydarzenie</h2>
						<p className="text-sm text-zinc-500 mt-1">
							Wypełnij poniższe pola, aby utworzyć nowe wydarzenie w kalendarzu.
						</p>
					</div>

					<form onSubmit={handleSubmit}>
						<FieldSet>
							<FieldGroup>
								<Field>
									<FieldLabel>
										Tytuł wydarzenia <span className="text-red-500">*</span>
									</FieldLabel>
									<Input
										name="title"
										placeholder="np. Zebranie rady pedagogicznej"
										value={formData.title}
										onChange={handleInputChange}
										required
									/>
									<FieldDescription>
										Podaj krótki i zwięzły tytuł wydarzenia
									</FieldDescription>
								</Field>

								<Field>
									<FieldLabel>Opis</FieldLabel>
									<Textarea
										name="description"
										placeholder="Dodaj opis wydarzenia..."
										value={formData.description}
										onChange={handleInputChange}
										rows={3}
									/>
									<FieldDescription>
										Opcjonalny szczegółowy opis wydarzenia
									</FieldDescription>
								</Field>

								<Field>
									<FieldLabel>
										Kategoria <span className="text-red-500">*</span>
									</FieldLabel>
									<Select value={formData.category} onValueChange={handleCategoryChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Wybierz kategorię" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="festiwal">Festiwal</SelectItem>
											<SelectItem value="wycieczka">Wycieczka</SelectItem>
											<SelectItem value="urodziny">Urodziny</SelectItem>
											<SelectItem value="przedstawienie">Przedstawienie</SelectItem>
											<SelectItem value="zajęcia">Zajęcia</SelectItem>
											<SelectItem value="inne">Inne</SelectItem>
										</SelectContent>
									</Select>
									<FieldDescription>
										Wybierz kategorię wydarzenia
									</FieldDescription>
								</Field>

								<Field>
									<FieldLabel>
										Data <span className="text-red-500">*</span>
									</FieldLabel>
									<Input
										name="date"
										type="date"
										value={formData.date}
										onChange={handleInputChange}
										required
									/>
								</Field>

								<div className="grid grid-cols-2 gap-4">
									<Field>
										<FieldLabel>
											Godz. rozpoczęcia <span className="text-red-500">*</span>
										</FieldLabel>
										<Input
											name="startTime"
											type="time"
											value={formData.startTime}
											onChange={handleInputChange}
											required
										/>
									</Field>

									<Field>
										<FieldLabel>
											Godz. zakończenia <span className="text-red-500">*</span>
										</FieldLabel>
										<Input
											name="endTime"
											type="time"
											value={formData.endTime}
											onChange={handleInputChange}
											required
										/>
									</Field>
								</div>

								<Field>
									<FieldLabel>Lokalizacja</FieldLabel>
									<Input
										name="location"
										placeholder="np. Sala konferencyjna"
										value={formData.location}
										onChange={handleInputChange}
									/>
									<FieldDescription>
										Miejsce, w którym odbędzie się wydarzenie
									</FieldDescription>
								</Field>
							</FieldGroup>
						</FieldSet>

						<div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsOpen(false)}
							>
								Anuluj
							</Button>
							<Button
								type="submit"
								className="bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-70"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Dodawanie..." : "Dodaj wydarzenie"}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}
