'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SendIcon from '@mui/icons-material/Send';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import OutboxIcon from '@mui/icons-material/Outbox';
import PersonIcon from '@mui/icons-material/Person';
import ReplyIcon from '@mui/icons-material/Reply';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { Loader2 } from 'lucide-react';

interface Teacher {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    surname: string;
  };
  group?: {
    id: string;
    name: string;
  } | null;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  body: string;
  status: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    surname: string;
    role: string;
  };
  receiver: {
    id: string;
    name: string;
    surname: string;
    role: string;
  };
}

type InboxFilter = 'all' | 'unread';

export default function WiadomosciPage() {
  const [activeSection, setActiveSection] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [selectedSentId, setSelectedSentId] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [inboxRes, sentRes] = await Promise.all([
        fetch('/api/messages?type=inbox'),
        fetch('/api/messages?type=sent'),
      ]);

      if (!inboxRes.ok || !sentRes.ok) {
        throw new Error('Błąd pobierania wiadomości');
      }

      const inboxData = await inboxRes.json();
      const sentData = await sentRes.json();

      setInboxMessages(inboxData);
      setSentMessages(sentData);

      if (inboxData.length > 0 && !selectedMessageId) {
        setSelectedMessageId(inboxData[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Nie udało się pobrać wiadomości');
    } finally {
      setLoading(false);
    }
  }, [selectedMessageId]);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/teachers');
      if (!res.ok) throw new Error('Błąd pobierania nauczycieli');
      const data = await res.json();
      setTeachers(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchTeachers();
  }, [fetchMessages, fetchTeachers]);

  const filteredMessages = useMemo(() => {
    return inboxMessages.filter((msg) => (filter === 'unread' ? !msg.isRead : true));
  }, [inboxMessages, filter]);

  const selectedMessage = useMemo(() => {
    return inboxMessages.find((msg) => msg.id === selectedMessageId) ?? null;
  }, [inboxMessages, selectedMessageId]);

  const unreadCount = inboxMessages.filter((msg) => !msg.isRead).length;

  const handleSelectMessage = async (id: string) => {
    setSelectedSentId(null);
    setSelectedMessageId(id);
    setActiveSection('inbox');

    const msg = inboxMessages.find((m) => m.id === id);
    if (msg && !msg.isRead) {
      try {
        await fetch(`/api/messages/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        });
        setInboxMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
        );
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    }
  };

  const handleToggleRead = async (id: string) => {
    const msg = inboxMessages.find((m) => m.id === id);
    if (!msg) return;

    try {
      await fetch(`/api/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !msg.isRead }),
      });
      setInboxMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: !m.isRead } : m))
      );
    } catch (err) {
      console.error('Error toggling read status:', err);
    }
  };

  const handleToggleTeacher = (id: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const handleSendMessage = async () => {
    if (selectedTeachers.length === 0) {
      alert('Wybierz przynajmniej jednego nauczyciela.');
      return;
    }
    if (subject.trim().length < 3) {
      alert('Podaj temat wiadomości (minimum 3 znaki).');
      return;
    }
    if (content.trim().length < 10) {
      alert('Treść wiadomości powinna mieć co najmniej 10 znaków.');
      return;
    }

    setSending(true);
    try {
      for (const teacherId of selectedTeachers) {
        const teacher = teachers.find((t) => t.id === teacherId);
        if (!teacher) continue;

        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: teacher.user.id,
            subject,
            body: content,
          }),
        });

        if (!res.ok) {
          throw new Error('Błąd wysyłania wiadomości');
        }
      }

      alert('Wiadomość została wysłana do wybranych nauczycieli.');
      setSelectedTeachers([]);
      setSubject('');
      setContent('');
      setActiveSection('sent');
      fetchMessages();
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd podczas wysyłania wiadomości.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Ładowanie wiadomości...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 min-h-[80vh] flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchMessages}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-[80vh] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Wiadomości</h1>
          <p className="text-sm text-gray-600">
            Skontaktuj się z nauczycielami lub przeglądaj otrzymane wiadomości z przedszkola.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700">
            <MailOutlineIcon className="text-blue-500" fontSize="small" />
            Nieprzeczytane:{' '}
            <strong className={unreadCount ? 'text-blue-600' : 'text-emerald-600'}>
              {unreadCount}
            </strong>
          </div>
          <button
            onClick={() => setActiveSection('compose')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <SendIcon fontSize="small" />
            Nowa wiadomość
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[60vh]">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <button
                onClick={() => {
                  setActiveSection('inbox');
                  if (!selectedMessageId && inboxMessages.length > 0) {
                    setSelectedMessageId(inboxMessages[0].id);
                  }
                }}
                className={`rounded-md px-3 py-1.5 ${
                  activeSection === 'inbox'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Odbiorcze
              </button>
              <button
                onClick={() => {
                  setActiveSection('sent');
                  if (!selectedSentId && sentMessages.length > 0) {
                    setSelectedSentId(sentMessages[0].id);
                  }
                }}
                className={`rounded-md px-3 py-1.5 ${
                  activeSection === 'sent'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Wysłane
              </button>
            </div>
            {activeSection === 'inbox' && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <button
                  onClick={() => setFilter('all')}
                  className={`rounded-md px-2 py-1 border ${
                    filter === 'all'
                      ? 'border-blue-300 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Wszystkie
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`rounded-md px-2 py-1 border ${
                    filter === 'unread'
                      ? 'border-blue-300 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Nieprzeczytane
                </button>
              </div>
            )}
          </div>
          <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
            {activeSection === 'inbox' ? (
              filteredMessages.length === 0 ? (
                <div className="p-6 text-sm text-gray-500 text-center">
                  Brak wiadomości w tej sekcji.
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg.id)}
                    className={`w-full text-left px-4 py-3 flex flex-col gap-1 transition-colors ${
                      selectedMessageId === msg.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {new Date(msg.createdAt).toLocaleDateString('pl-PL', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.isRead ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <MarkEmailReadIcon fontSize="inherit" />
                          Odczytane
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <MarkEmailUnreadIcon fontSize="inherit" />
                          Nowa
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{msg.subject}</p>
                    <p className="text-xs text-gray-500">
                      Od: {msg.sender.name} {msg.sender.surname}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">{msg.body}</p>
                  </button>
                ))
              )
            ) : sentMessages.length === 0 ? (
              <div className="p-6 text-sm text-gray-500 text-center">Brak wysłanych wiadomości.</div>
            ) : (
              sentMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelectedSentId(msg.id);
                    setSelectedMessageId(null);
                  }}
                  className={`w-full text-left px-4 py-3 flex flex-col gap-1 transition-colors ${
                    selectedSentId === msg.id ? 'bg-purple-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(msg.createdAt).toLocaleDateString('pl-PL', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-purple-600">
                      <OutboxIcon fontSize="inherit" />
                      Wysłano
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{msg.subject}</p>
                  <p className="text-xs text-gray-500">
                    Do: {msg.receiver.name} {msg.receiver.surname}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2">{msg.body}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 min-h-[60vh] flex flex-col">
          {activeSection === 'compose' ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Nowa wiadomość</h2>
                <p className="text-sm text-gray-500">
                  Wybierz nauczycieli, wpisz temat i treść wiadomości. Wiadomość trafi do wskazanych
                  adresatów.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Odbiorcy
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {teachers.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-2">Brak dostępnych nauczycieli.</p>
                  ) : (
                    teachers.map((teacher) => (
                      <label
                        key={teacher.id}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm cursor-pointer ${
                          selectedTeachers.includes(teacher.id)
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeachers.includes(teacher.id)}
                          onChange={() => handleToggleTeacher(teacher.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold text-gray-800 flex items-center gap-1">
                            <PersonIcon fontSize="small" className="text-blue-500" />
                            {teacher.user.name} {teacher.user.surname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {teacher.group?.name || 'Brak przypisanej grupy'}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Temat
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Wpisz temat wiadomości..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Treść wiadomości
                </label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Napisz swoją wiadomość do nauczycieli..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                >
                  <SendIcon fontSize="small" />
                  {sending ? 'Wysyłanie...' : 'Wyślij wiadomość'}
                </button>
                <button
                  onClick={() => setActiveSection('inbox')}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
              </div>
            </div>
          ) : activeSection === 'sent' ? (
            selectedSentId ? (
              (() => {
                const sent = sentMessages.find((msg) => msg.id === selectedSentId);
                if (!sent) {
                  return (
                    <div className="flex flex-1 flex-col items-center justify-center text-center text-gray-500">
                      <MailOutlineIcon fontSize="large" className="text-blue-400 mb-2" />
                      <p>Wybierz wiadomość ze skrzynki „Wysłane", aby zobaczyć szczegóły.</p>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">{sent.subject}</h2>
                        <p className="text-sm text-gray-500">
                          Odbiorca:{' '}
                          <span className="text-gray-700 font-medium">
                            {sent.receiver.name} {sent.receiver.surname}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(sent.createdAt).toLocaleString('pl-PL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSubject(`Re: ${sent.subject}`);
                          setContent(`\n\n---\nOryginał:\n${sent.body}`);
                          const teacher = teachers.find((t) => t.user.id === sent.receiver.id);
                          if (teacher) {
                            setSelectedTeachers([teacher.id]);
                          }
                          setActiveSection('compose');
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <ReplyIcon fontSize="small" />
                        Wyślij ponownie
                      </button>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed flex-1">
                      {sent.body}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveSection('compose')}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                      >
                        <ChatBubbleOutlineIcon fontSize="small" />
                        Napisz nową wiadomość
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-gray-500">
                <MailOutlineIcon fontSize="large" className="text-blue-400 mb-2" />
                <p>Wybierz wiadomość ze skrzynki „Wysłane", aby zobaczyć szczegóły.</p>
              </div>
            )
          ) : selectedMessage ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{selectedMessage.subject}</h2>
                  <p className="text-sm text-gray-500">
                    Od:{' '}
                    <span className="text-gray-700 font-medium">
                      {selectedMessage.sender.name} {selectedMessage.sender.surname}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedMessage.createdAt).toLocaleString('pl-PL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSubject(`Re: ${selectedMessage.subject}`);
                    setContent('');
                    const teacher = teachers.find((t) => t.user.id === selectedMessage.sender.id);
                    if (teacher) {
                      setSelectedTeachers([teacher.id]);
                    }
                    setActiveSection('compose');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ReplyIcon fontSize="small" />
                  Odpowiedz
                </button>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedMessage.body}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => selectedMessage && handleToggleRead(selectedMessage.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {selectedMessage.isRead ? (
                    <>
                      <MarkEmailUnreadIcon fontSize="small" />
                      Oznacz jako nieprzeczytaną
                    </>
                  ) : (
                    <>
                      <MarkEmailReadIcon fontSize="small" />
                      Oznacz jako przeczytaną
                    </>
                  )}
                </button>
                <button
                  onClick={() => setActiveSection('compose')}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <ChatBubbleOutlineIcon fontSize="small" />
                  Napisz nową wiadomość
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <MailOutlineIcon fontSize="large" className="text-blue-400 mb-2" />
              <p>Wybierz wiadomość ze skrzynki, aby zobaczyć szczegóły.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
