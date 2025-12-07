"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Inbox, Send, Mail, Loader2, ChevronLeft, 
  User, Clock, Plus, X, Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

interface Parent {
  id: string;
  name: string;
  surname: string;
  email: string;
}

type ViewMode = "inbox" | "sent" | "compose" | "detail";

export default function MessagesInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Compose form state
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

  const fetchParents = useCallback(async () => {
    try {
      // Fetch children first to get their parents
      const res = await fetch("/api/groups/children");
      if (!res.ok) throw new Error("Failed to fetch children");
      const children = await res.json();
      
      // Extract unique parents
      const parentMap = new Map<string, Parent>();
      children.forEach((child: { parent?: Parent }) => {
        if (child.parent) {
          parentMap.set(child.parent.id, child.parent);
        }
      });
      setParents(Array.from(parentMap.values()));
    } catch (err) {
      console.error("Error fetching parents:", err);
    }
  }, []);

  useEffect(() => {
    fetchMessages("inbox");
    fetchParents();
  }, [fetchMessages, fetchParents]);

  const handleViewChange = (mode: "inbox" | "sent") => {
    setViewMode(mode);
    setSelectedMessage(null);
    fetchMessages(mode);
  };

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);
    setViewMode("detail");

    // Mark as read if viewing inbox message
    if (!message.isRead && viewMode === "inbox") {
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

  // Compose View
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
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Odbiorca (Rodzic)
            </label>
            <select
              value={newMessage.receiverId}
              onChange={(e) => setNewMessage(prev => ({ ...prev, receiverId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Wybierz odbiorcę...</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name} {parent.surname} ({parent.email})
                </option>
              ))}
            </select>
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
            <Button onClick={handleSendMessage} disabled={sending}>
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

  // Message Detail View
  if (viewMode === "detail" && selectedMessage) {
    const isInbox = selectedMessage.receiver.id !== selectedMessage.sender.id;
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
          }}>
            <Mail className="h-4 w-4 mr-2" />
            Odpowiedz
          </Button>
        </div>
      </section>
    );
  }

  // Inbox/Sent List View
  return (
    <section className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Wiadomości
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Komunikacja z rodzicami
          </p>
        </div>

        <Button onClick={() => setViewMode("compose")}>
          <Plus className="h-4 w-4 mr-2" />
          Nowa wiadomość
        </Button>
      </div>

      {/* Tabs */}
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

      {/* Search */}
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

      {/* Messages List */}
      <div className="flex flex-col gap-2">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => {
            const isInbox = viewMode === "inbox";
            const person = isInbox ? message.sender : message.receiver;

            return (
              <button
                key={message.id}
                onClick={() => handleMessageClick(message)}
                className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                  !message.isRead && isInbox
                    ? "border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20"
                    : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm ${!message.isRead && isInbox ? "font-semibold" : ""} text-zinc-900 dark:text-zinc-100`}>
                      {person.name} {person.surname}
                    </span>
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
                  <div className="h-2 w-2 rounded-full bg-sky-500 flex-shrink-0 mt-2" />
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

