"use client"

import { useState, useEffect } from "react"
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

type AudienceOption = "ALL" | "TEACHERS" | "PARENTS"

interface EventFormData {
	title: string
	description: string
	date: string
	startTime: string
	endTime: string
	location: string
	category: string
	selectGroup: string | null
	audience: AudienceOption
}

interface GroupOption {
	id: string
	name: string
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
		category: "inne",
		selectGroup: null,
		audience: "ALL"
	})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [buttonTone, setButtonTone] = useState<"default" | "success" | "error">("default")
	const [groups, setGroups] = useState<GroupOption[]>([])
	const [groupsError, setGroupsError] = useState<string | null>(null)
	const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(false)

	useEffect(() => {
		const fetchGroups = async () => {
			setIsLoadingGroups(true)
			try {
				const response = await fetch("/api/groups")
				if (!response.ok) {
					throw new Error("Failed to fetch groups")
				}
				const data: GroupOption[] = await response.json()
				setGroups(data)
				setGroupsError(null)
			} catch {
				setGroups([])
				setGroupsError("Nie udało się pobrać listy grup.")
			} finally {
				setIsLoadingGroups(false)
			}
		}

		fetchGroups()
	}, [])

	const resetForm = () => {
		setFormData({
			title: "",
			description: "",
			date: "",
			startTime: "",
			endTime: "",
			location: "",
			category: "inne",
			selectGroup: null,
			audience: "ALL"
		})
		setButtonTone("default")
		setIsSubmitting(false)
	}

	const openModal = () => {
		resetForm()
		setIsOpen(true)
	}

	const closeModal = () => {
		setIsOpen(false)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (isSubmitting) return
		setIsSubmitting(true)
		setButtonTone("default")

		const categoryMap: Record<string, string> = {
			"festiwal": "FESTIWAL",
			"wycieczka": "WYCIECZKA",
			"urodziny": "URODZINY",
			"przedstawienie": "PRZEDSTAWIENIE",
			"zajęcia": "ZAJECIA",
			"inne": "INNE"
		}
		const eventDate = new Date(`${formData.date}T${formData.startTime}`)
		const endDate = formData.endTime ? new Date(`${formData.date}T${formData.endTime}`) : null
		const selectedGroup = groups.find(group => group.id === formData.selectGroup)

		const payload = {
			title: formData.title,
			content: formData.description || formData.title,
			category: categoryMap[formData.category] || "INNE",
			eventDate: eventDate.toISOString(),
			startTime: eventDate.toISOString(),
			endTime: endDate ? endDate.toISOString() : null,
			location: formData.location,
			audience: formData.audience,
			targetGroup: formData.audience,
			groupId: selectedGroup?.id || null,
			isImportant: false
		}

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

			await response.json()

			resetForm()
			await onEventCreated?.()
			setButtonTone("success")
		} catch {
			setButtonTone("error")
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

	const handleGroupChange = (value: string) => {
		setFormData(prev => ({
			...prev,
			selectGroup: value === "none" ? null : value
		}))
	}

	const handleAudienceChange = (value: AudienceOption) => {
		setFormData(prev => ({
			...prev,
			audience: value
		}))
	}

	if (!isOpen) {
		return (
			<Button
				onClick={openModal}
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

								<Field>
									<FieldLabel>Grupa / odbiorcy</FieldLabel>
									<Select
										value={formData.selectGroup ?? "none"}
										onValueChange={handleGroupChange}
										disabled={isLoadingGroups || !!groupsError}
									>
										<SelectTrigger className="w-full">
											<SelectValue
												placeholder={
													isLoadingGroups
														? "Ładowanie grup..."
														: "Wybierz grupę (opcjonalnie)"
												}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Brak przypisania</SelectItem>
											{groups.map(group => (
												<SelectItem key={group.id} value={group.id}>
													{group.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FieldDescription>
										Wskaż grupę lub odbiorców wydarzenia (opcjonalnie)
									</FieldDescription>
									{groupsError && (
										<p className="text-sm text-red-600 mt-1">{groupsError}</p>
									)}
								</Field>

								<Field>
									<FieldLabel>Odbiorcy ogłoszenia</FieldLabel>
									<Select value={formData.audience} onValueChange={value => handleAudienceChange(value as AudienceOption)}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Wybierz odbiorców" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ALL">Wszyscy</SelectItem>
											<SelectItem value="TEACHERS">Tylko nauczyciele</SelectItem>
											<SelectItem value="PARENTS">Tylko rodzice</SelectItem>
										</SelectContent>
									</Select>
									<FieldDescription>
										Określ kto zobaczy to ogłoszenie
									</FieldDescription>
								</Field>
							</FieldGroup>
						</FieldSet>

						<div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
							<Button
								type="button"
								variant="outline"
								onClick={closeModal}
							>
								Anuluj
							</Button>
							<Button
								type="submit"
								className={`text-white disabled:opacity-70 ${
									buttonTone === "success"
										? "bg-emerald-500 hover:bg-emerald-600"
										: buttonTone === "error"
										? "bg-red-500 hover:bg-red-600"
										: "bg-sky-500 hover:bg-sky-600"
								}`}
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
