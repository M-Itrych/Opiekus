'use client';

import { useMemo, useState } from 'react';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ParentLayout from '@/app/components/global/Layout/ParentLayout';
import SendIcon from '@mui/icons-material/Send';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import OutboxIcon from '@mui/icons-material/Outbox';
import PersonIcon from '@mui/icons-material/Person';
import ReplyIcon from '@mui/icons-material/Reply';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface Teacher {
  id: string;
  name: string;
  subject: string;
}

interface Message {
  id: string;
  sender: string;
  senderRole: 'nauczyciel' | 'administracja';
  subject: string;
  preview: string;
  body: string;
  date: string; // ISO
  isRead?: boolean;
}

const teachers: Teacher[] = [
  { id: 't-01', name: 'Anna Kowalczyk', subject: 'Wychowawca grupy "Motylki"' },
  { id: 't-02', name: 'Marek Nowak', subject: 'Język angielski' },
  { id: 't-03', name: 'Ewelina Wróbel', subject: 'Logopedia' },
  { id: 't-04', name: 'Katarzyna Zielińska', subject: 'Zajęcia sportowe' },
];

const inboxSeed: Message[] = [
  {
    id: 'msg-001',
    sender: 'Anna Kowalczyk',
    senderRole: 'nauczyciel',
    subject: 'Podsumowanie tygodnia',
    preview: 'Szanowni Państwo, przesyłam krótkie podsumowanie zajęć z minionego tygodnia...',
    body: `Szanowni Państwo,

W minionym tygodniu skupiliśmy się na temacie zimy. Dzieci wykonywały kreatywne prace plastyczne oraz uczyły się zimowych piosenek. Przypominam również o czwartkowym wyjściu na zajęcia sportowe – proszę pamiętać o stroju gimnastycznym.

W razie pytań zapraszam do kontaktu.

Pozdrawiam serdecznie,
Anna Kowalczyk`,
    date: '2025-01-18T15:40:00',
    isRead: false,
  },
  {
    id: 'msg-002',
    sender: 'Administracja przedszkola',
    senderRole: 'administracja',
    subject: 'Informacja o płatnościach',
    preview: 'Przypominamy o terminie płatności za czesne za miesiąc styczeń...',
    body: `Dzień dobry,

Przypominamy o terminie płatności za czesne za miesiąc styczeń, który upływa 25 stycznia.
W razie trudności z terminową wpłatą prosimy o kontakt z administracją przedszkola.

Pozdrawiamy,
Administracja`,
    date: '2025-01-16T09:15:00',
    isRead: true,
  },
  {
    id: 'msg-003',
    sender: 'Marek Nowak',
    senderRole: 'nauczyciel',
    subject: 'Materiały z języka angielskiego',
    preview: 'Przesyłam materiały powtórkowe z bieżącego modułu...',
    body: `Dzień dobry,

Przesyłam materiały powtórkowe z języka angielskiego. Dzieci bardzo chętnie pracowały w grupach. Zachęcam do wspólnego utrwalania słówek w domu.

Pozdrawiam,
Marek Nowak`,
    date: '2025-01-12T17:55:00',
    isRead: true,
  },
];

type InboxFilter = 'all' | 'unread';

interface SentMessage {
  id: string;
  recipients: string[];
  subject: string;
  preview: string;
  body: string;
  date: string;
}

export default function WiadomosciPage() {
  const [activeSection, setActiveSection] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(inboxSeed[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>(inboxSeed);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [selectedSentId, setSelectedSentId] = useState<string | null>(null);

  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => (filter === 'unread' ? !msg.isRead : true));
  }, [messages, filter]);

  const selectedMessage = useMemo(() => {
    return messages.find((msg) => msg.id === selectedMessageId) ?? null;
  }, [messages, selectedMessageId]);

  const unreadCount = messages.filter((msg) => !msg.isRead).length;

  const handleSelectMessage = (id: string) => {
    setSelectedSentId(null);
    setSelectedMessageId(id);
    setActiveSection('inbox');
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, isRead: true } : msg))
    );
  };

  const handleToggleRead = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, isRead: !msg.isRead } : msg))
    );
  };

  const handleToggleTeacher = (id: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const handleSendMessage = () => {
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

    const now = new Date().toISOString();
    const newSent: SentMessage = {
      id: `sent-${Date.now()}`,
      recipients: selectedTeachers.map(
        (id) => teachers.find((teacher) => teacher.id === id)?.name ?? 'Nauczyciel'
      ),
      subject,
      preview: content.slice(0, 120) + (content.length > 120 ? '…' : ''),
      body: content,
      date: now,
    };

    setSentMessages((prev) => [newSent, ...prev]);
    setSelectedSentId(newSent.id);

    alert('Wiadomość została wysłana do wybranych nauczycieli.');
    setSelectedTeachers([]);
    setSubject('');
    setContent('');
    setActiveSection('sent');
  };

  return (
    <ParentLayout
      title="Wiadomości"
      description="Skontaktuj się z nauczycielami lub przeglądaj otrzymane wiadomości z przedszkola."
      headerAction={
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700">
            <MailOutlineIcon className="text-sky-500" fontSize="small" />
            Nieprzeczytane:{' '}
            <strong className={unreadCount ? 'text-sky-600' : 'text-emerald-600'}>
              {unreadCount}
            </strong>
          </div>
          <button
            onClick={() => setActiveSection('compose')}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
          >
            <SendIcon fontSize="small" />
            Nowa wiadomość
          </button>
        </div>
      }
    >
      <div className="min-h-[80vh] flex flex-col">

      <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6">
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[60vh]">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <button
                onClick={() => {
                  setActiveSection('inbox');
                  if (!selectedMessageId && messages.length > 0) {
                    setSelectedMessageId(messages[0].id);
                  }
                }}
                className={`rounded-md px-3 py-1.5 ${
                  activeSection === 'inbox'
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-zinc-600 hover:bg-zinc-100'
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
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Wysłane
              </button>
            </div>
            {activeSection === 'inbox' && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <button
                  onClick={() => setFilter('all')}
                  className={`rounded-md px-2 py-1 border ${
                    filter === 'all'
                      ? 'border-sky-300 bg-sky-50 text-sky-600'
                      : 'border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  Wszystkie
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`rounded-md px-2 py-1 border ${
                    filter === 'unread'
                      ? 'border-sky-300 bg-sky-50 text-sky-600'
                      : 'border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  Nieprzeczytane
                </button>
              </div>
            )}
          </div>
          <div className="divide-y divide-zinc-100 flex-1 overflow-y-auto">
            {activeSection === 'inbox' ? (
              filteredMessages.length === 0 ? (
                <div className="p-6 text-sm text-zinc-500 text-center">
                  Brak wiadomości w tej sekcji.
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg.id)}
                    className={`w-full text-left px-4 py-3 flex flex-col gap-1 transition-colors ${
                      selectedMessageId === msg.id ? 'bg-sky-50' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>
                        {new Date(msg.date).toLocaleDateString('pl-PL', {
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
                        <span className="inline-flex items-center gap-1 text-sky-600">
                          <MarkEmailUnreadIcon fontSize="inherit" />
                          Nowa
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">{msg.subject}</p>
                    <p className="text-xs text-zinc-500 line-clamp-2">{msg.preview}</p>
                  </button>
                ))
              )
            ) : sentMessages.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500 text-center">Brak wysłanych wiadomości.</div>
            ) : (
              sentMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelectedSentId(msg.id);
                    setSelectedMessageId(null);
                  }}
                  className={`w-full text-left px-4 py-3 flex flex-col gap-1 transition-colors ${
                    selectedSentId === msg.id ? 'bg-purple-50' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {new Date(msg.date).toLocaleDateString('pl-PL', {
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
                  <p className="text-sm font-semibold text-zinc-900">{msg.subject}</p>
                  <p className="text-xs text-zinc-500">Do: {msg.recipients.join(', ')}</p>
                  <p className="text-xs text-zinc-500 line-clamp-2">{msg.preview}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 min-h-[60vh] flex flex-col">
          {activeSection === 'compose' ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 mb-1">Nowa wiadomość</h2>
                <p className="text-sm text-zinc-500">
                  Wybierz nauczycieli, wpisz temat i treść wiadomości. Wiadomość trafi do wskazanych
                  adresatów.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Odbiorcy
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {teachers.map((teacher) => (
                    <label
                      key={teacher.id}
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm ${
                        selectedTeachers.includes(teacher.id)
                          ? 'border-sky-300 bg-sky-50'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeachers.includes(teacher.id)}
                        onChange={() => handleToggleTeacher(teacher.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-zinc-900 flex items-center gap-1">
                          <PersonIcon fontSize="small" className="text-sky-500" />
                          {teacher.name}
                        </p>
                        <p className="text-xs text-zinc-500">{teacher.subject}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Temat
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Wpisz temat wiadomości..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Treść wiadomości
                </label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Napisz swoją wiadomość do nauczycieli..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSendMessage}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
                >
                  <SendIcon fontSize="small" />
                  Wyślij wiadomość
                </button>
                <button
                  onClick={() => setActiveSection('inbox')}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
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
                    <div className="flex flex-1 flex-col items-center justify-center text-center text-zinc-500">
                      <MailOutlineIcon fontSize="large" className="text-sky-400 mb-2" />
                      <p>Wybierz wiadomość ze skrzynki „Wysłane", aby zobaczyć szczegóły.</p>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-zinc-900">{sent.subject}</h2>
                        <p className="text-sm text-zinc-500">
                          Odbiorcy:{' '}
                          <span className="text-zinc-700 font-medium">
                            {sent.recipients.join(', ')}
                          </span>
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(sent.date).toLocaleString('pl-PL', {
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
                          setSelectedTeachers(
                            sent.recipients
                              .map((name) => teachers.find((teacher) => teacher.name === name)?.id)
                              .filter(Boolean) as string[]
                          );
                          setActiveSection('compose');
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                      >
                        <ReplyIcon fontSize="small" />
                        Wyślij ponownie
                      </button>
                    </div>
                    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed flex-1">
                      {sent.body}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveSection('compose')}
                        className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
                      >
                        <ChatBubbleOutlineIcon fontSize="small" />
                        Napisz nową wiadomość
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-zinc-500">
                <MailOutlineIcon fontSize="large" className="text-sky-400 mb-2" />
                <p>Wybierz wiadomość ze skrzynki „Wysłane", aby zobaczyć szczegóły.</p>
              </div>
            )
          ) : selectedMessage ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">{selectedMessage.subject}</h2>
                  <p className="text-sm text-zinc-500">
                    {selectedMessage.senderRole === 'nauczyciel' ? 'Nauczyciel' : 'Administracja'}:{' '}
                    <span className="text-zinc-700 font-medium">{selectedMessage.sender}</span>
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(selectedMessage.date).toLocaleString('pl-PL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('compose')}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  <ReplyIcon fontSize="small" />
                  Odpowiedz
                </button>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                {selectedMessage.body}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => selectedMessage && handleToggleRead(selectedMessage.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
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
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
                >
                  <ChatBubbleOutlineIcon fontSize="small" />
                  Napisz nową wiadomość
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500">
              <MailOutlineIcon fontSize="large" className="text-sky-400 mb-2" />
              <p>Wybierz wiadomość ze skrzynki, aby zobaczyć szczegóły.</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </ParentLayout>
  );
}

