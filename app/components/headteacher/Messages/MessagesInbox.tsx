"use client";

import { useState, useEffect, useCallback } from "react";
import { 
	Inbox, Send, Mail, Loader2, ChevronLeft, 
	User, Clock, Plus, Search, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface UserInfo {
	id: string;
	name: string;
	surname: string;
	role: string;
}

interface Message {
	id: string;
	subject: string;
	body: string;
	isRead: boolean;
	createdAt: string;
	sender: UserInfo;
	receiver: UserInfo;
}

interface Recipient {
	id: string;
	name: string;
	surname: string;
	email?: string;
	role: string;
}

type ViewMode = "inbox" | "sent" | "compose" | "detail";
type RecipientFilter = "all" | "PARENT" | "TEACHER" | "STAFF";

const ROLE_LABELS: Record<string, string> = {
	PARENT: "Rodzic",
	TEACHER: "Nauczyciel",
	HEADTEACHER: "Dyrektor",
	ADMIN: "Administrator",
};

export default function MessagesInbox() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [recipients, setRecipients] = useState<Recipient[]>([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>("inbox");
	const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
	const [previousViewMode, setPreviousViewMode] = useState<"inbox" | "sent">("inbox");
	const [searchQuery, setSearchQuery] = useState("");
	const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>("all");

	const [newMessage, setNewMessage] = useState({
		receiverId: "",
		subject: "",
		body: "",
	});

	const fetchMessages = useCallback(async (type: "inbox" | "sent") => {
		try {
			setLoading(true);
			const res = await fetch(`/api/messages?type=${type}`);
			if (!res.ok) throw new Error("Failed to fetch messages");
			const data = await res.json();
			setMessages(data);
		} catch (err) {
			console.error("Error fetching messages:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchRecipients = useCallback(async () => {
		try {
			const [parentsRes, staffRes] = await Promise.all([
				fetch("/api/users?role=PARENT"),
				fetch("/api/staff"),
			]);

			const allRecipients: Recipient[] = [];

			if (parentsRes.ok) {
				const parents = await parentsRes.json();
				parents.forEach((parent: { id: string; name: string; surname: string; email: string }) => {
					allRecipients.push({
						id: parent.id,
						name: parent.name,
						surname: parent.surname,
						email: parent.email,
						role: "PARENT",
					});
				});
			}

			if (staffRes.ok) {
				const staff = await staffRes.json();
				staff.forEach((member: { id: string; staffRole: string; user: { id: string; name: string; surname: string; email: string } }) => {
					allRecipients.push({
						id: member.user.id,
						name: member.user.name,
						surname: member.user.surname,
						email: member.user.email,
						role: member.staffRole === "NAUCZYCIEL" ? "TEACHER" : "STAFF",
					});
				});
			}

			setRecipients(allRecipients);
		} catch (err) {
			console.error("Error fetching recipients:", err);
		}
	}, []);

	useEffect(() => {
		fetchMessages("inbox");
		fetchRecipients();
	}, [fetchMessages, fetchRecipients]);

	const handleViewChange = (mode: "inbox" | "sent") => {
		setViewMode(mode);
		setPreviousViewMode(mode);
		setSelectedMessage(null);
		fetchMessages(mode);
	};

	const handleMessageClick = async (message: Message, fromView: "inbox" | "sent") => {
		setSelectedMessage(message);
		setPreviousViewMode(fromView);
		setViewMode("detail");

		if (!message.isRead && fromView === "inbox") {
			try {
				await fetch(`/api/messages/${message.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ isRead: true }),
				});
				setMessages(prev => 
					prev.map(m => m.id === message.id ? { ...m, isRead: true } : m)
				);
			} catch (err) {
				console.error("Error marking message as read:", err);
			}
		}
	};

	const handleSendMessage = async () => {
		if (!newMessage.receiverId || !newMessage.subject || !newMessage.body) {
			alert("Wypełnij wszystkie pola");
			return;
		}

		setSending(true);
		try {
			const res = await fetch("/api/messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newMessage),
			});

			if (!res.ok) throw new Error("Failed to send message");

			setNewMessage({ receiverId: "", subject: "", body: "" });
			setViewMode("sent");
			fetchMessages("sent");
			alert("Wiadomość została wysłana!");
		} catch (err) {
			console.error("Error sending message:", err);
			alert("Wystąpił błąd podczas wysyłania wiadomości");
		} finally {
			setSending(false);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
		} else if (diffDays === 1) {
			return "Wczoraj";
		} else if (diffDays < 7) {
			return date.toLocaleDateString("pl-PL", { weekday: "long" });
		} else {
			return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
		}
	};

	const filteredMessages = messages.filter(
		(message) =>
			message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
			message.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			message.sender.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
			message.receiver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			message.receiver.surname.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const filteredRecipients = recipients.filter(recipient => {
		if (recipientFilter === "all") return true;
		if (recipientFilter === "STAFF") return recipient.role === "STAFF";
		return recipient.role === recipientFilter;
	});

	const unreadCount = messages.filter(m => !m.isRead).length;

	if (loading && viewMode !== "compose") {
		return (
			<section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-sky-600" />
					<span className="ml-2 text-zinc-600">Ładowanie wiadomości...</span>
				</div>
			</section>
		);
	}

	if (viewMode === "compose") {
		return (
			<section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="sm" onClick={() => setViewMode("inbox")}>
						<ChevronLeft className="h-4 w-4 mr-1" />
						Powrót
					</Button>
					<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
						Nowa wiadomość
					</h2>
				</div>

				<div className="space-y-4">
					<div className="flex gap-4">
						<div className="w-48">
							<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
								Filtruj odbiorców
							</label>
							<Select value={recipientFilter} onValueChange={(v) => setRecipientFilter(v as RecipientFilter)}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Wszyscy</SelectItem>
									<SelectItem value="PARENT">Rodzice</SelectItem>
									<SelectItem value="TEACHER">Nauczyciele</SelectItem>
									<SelectItem value="STAFF">Pracownicy</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex-1">
							<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
								Odbiorca
							</label>
							<Select 
								value={newMessage.receiverId} 
								onValueChange={(v) => setNewMessage(prev => ({ ...prev, receiverId: v }))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Wybierz odbiorcę..." />
								</SelectTrigger>
								<SelectContent>
									{filteredRecipients.map((recipient) => (
										<SelectItem key={recipient.id} value={recipient.id}>
											<div className="flex items-center gap-2">
												<span>{recipient.name} {recipient.surname}</span>
												<span className="text-xs text-zinc-500">
													({ROLE_LABELS[recipient.role] || recipient.role})
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
							Temat
						</label>
						<Input
							value={newMessage.subject}
							onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
							placeholder="Temat wiadomości..."
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
							Treść
						</label>
						<Textarea
							value={newMessage.body}
							onChange={(e) => setNewMessage(prev => ({ ...prev, body: e.target.value }))}
							placeholder="Napisz wiadomość..."
							rows={8}
						/>
					</div>

					<div className="flex justify-end gap-3">
						<Button variant="outline" onClick={() => setViewMode("inbox")}>
							Anuluj
						</Button>
						<Button onClick={handleSendMessage} disabled={sending} className="bg-sky-600 hover:bg-sky-500">
							{sending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
									Wysyłanie...
								</>
							) : (
								<>
									<Send className="h-4 w-4 mr-2" />
									Wyślij
								</>
							)}
						</Button>
					</div>
				</div>
			</section>
		);
	}

	if (viewMode === "detail" && selectedMessage) {
		const isInbox = previousViewMode === "inbox";
		const otherPerson = isInbox ? selectedMessage.sender : selectedMessage.receiver;

		return (
			<section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="sm" onClick={() => {
						setSelectedMessage(null);
						setViewMode("inbox");
					}}>
						<ChevronLeft className="h-4 w-4 mr-1" />
						Powrót
					</Button>
				</div>

				<div className="border-b border-zinc-200 pb-4 dark:border-zinc-700">
					<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
						{selectedMessage.subject}
					</h2>
					<div className="mt-2 flex items-center gap-4 text-sm text-zinc-500">
						<div className="flex items-center gap-2">
							<User className="h-4 w-4" />
							<span>
								{isInbox ? "Od:" : "Do:"} {otherPerson.name} {otherPerson.surname}
								<span className="text-xs ml-1">({ROLE_LABELS[otherPerson.role] || otherPerson.role})</span>
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4" />
							<span>{new Date(selectedMessage.createdAt).toLocaleString("pl-PL")}</span>
						</div>
					</div>
				</div>

				<div className="prose prose-zinc dark:prose-invert max-w-none">
					<p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
						{selectedMessage.body}
					</p>
				</div>

				<div className="flex justify-end">
					<Button onClick={() => {
						setNewMessage({
							receiverId: selectedMessage.sender.id,
							subject: `Re: ${selectedMessage.subject}`,
							body: "",
						});
						setViewMode("compose");
					}} className="bg-sky-600 hover:bg-sky-500">
						<Mail className="h-4 w-4 mr-2" />
						Odpowiedz
					</Button>
				</div>
			</section>
		);
	}

	return (
		<section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex flex-col gap-1">
					<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
						Wiadomości
					</h2>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						Komunikacja z rodzicami i pracownikami
					</p>
				</div>

				<Button onClick={() => setViewMode("compose")} className="bg-sky-600 hover:bg-sky-500">
					<Plus className="h-4 w-4 mr-2" />
					Nowa wiadomość
				</Button>
			</div>

			<div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
				<button
					onClick={() => handleViewChange("inbox")}
					className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
						viewMode === "inbox"
							? "border-b-2 border-sky-500 text-sky-600"
							: "text-zinc-500 hover:text-zinc-700"
					}`}
				>
					<Inbox className="h-4 w-4" />
					Odebrane
					{unreadCount > 0 && viewMode === "inbox" && (
						<span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs text-white">
							{unreadCount}
						</span>
					)}
				</button>
				<button
					onClick={() => handleViewChange("sent")}
					className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
						viewMode === "sent"
							? "border-b-2 border-sky-500 text-sky-600"
							: "text-zinc-500 hover:text-zinc-700"
					}`}
				>
					<Send className="h-4 w-4" />
					Wysłane
				</button>
			</div>

			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
				<Input
					type="text"
					placeholder="Szukaj wiadomości..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-10"
				/>
			</div>

			<div className="flex flex-col gap-2">
				{filteredMessages.length > 0 ? (
					filteredMessages.map((message) => {
						const isInbox = viewMode === "inbox";
						const person = isInbox ? message.sender : message.receiver;

						return (
							<button
								key={message.id}
								onClick={() => handleMessageClick(message, viewMode as "inbox" | "sent")}
								className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md ${
									!message.isRead && isInbox
										? "border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20"
										: "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
								}`}
							>
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
									{person.role === "PARENT" ? (
										<Users className="h-5 w-5" />
									) : (
										<User className="h-5 w-5" />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<span className={`text-sm ${!message.isRead && isInbox ? "font-semibold" : ""} text-zinc-900 dark:text-zinc-100`}>
												{person.name} {person.surname}
											</span>
											<span className="text-xs text-zinc-400">
												{ROLE_LABELS[person.role] || person.role}
											</span>
										</div>
										<span className="text-xs text-zinc-500 whitespace-nowrap">
											{formatDate(message.createdAt)}
										</span>
									</div>
									<h3 className={`text-sm ${!message.isRead && isInbox ? "font-semibold" : ""} text-zinc-800 dark:text-zinc-200 truncate`}>
										{message.subject}
									</h3>
									<p className="text-xs text-zinc-500 truncate mt-1">
										{message.body}
									</p>
								</div>
								{!message.isRead && isInbox && (
									<div className="h-2 w-2 rounded-full bg-sky-500 shrink-0 mt-2" />
								)}
							</button>
						);
					})
				) : (
					<div className="py-12 text-center">
						<Mail className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
						<p className="text-zinc-500 dark:text-zinc-400">
							{searchQuery
								? "Nie znaleziono wiadomości pasujących do wyszukiwania"
								: viewMode === "inbox"
								? "Brak wiadomości w skrzynce odbiorczej"
								: "Brak wysłanych wiadomości"}
						</p>
					</div>
				)}
			</div>
		</section>
	);
}

