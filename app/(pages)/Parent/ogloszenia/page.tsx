'use client';

import { useMemo, useState } from 'react';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import HikingIcon from '@mui/icons-material/Hiking';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import InfoIcon from '@mui/icons-material/Info';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import UndoIcon from '@mui/icons-material/Undo';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';

type AnnouncementCategory = 'wyjscie' | 'spotkanie' | 'organizacyjne';

interface Announcement {
  id: string;
  title: string;
  date: string; 
  category: AnnouncementCategory;
  content: string;
  requiresResponse?: boolean;
  defaultRead?: boolean;
}

const categoryMeta: Record<
  AnnouncementCategory,
  { label: string; icon: typeof NotificationsActiveIcon; color: string }
> = {
  wyjscie: {
    label: 'Wyjścia i wycieczki',
    icon: HikingIcon,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  spotkanie: {
    label: 'Spotkania z rodzicami',
    icon: GroupsIcon,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  organizacyjne: {
    label: 'Informacje organizacyjne',
    icon: CheckroomIcon,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
};

const announcementsSeed: Announcement[] = [
  {
    id: 'ann-001',
    title: 'Wycieczka do Muzeum Przyrodniczego',
    date: '2025-01-20',
    category: 'wyjscie',
    content:
      'W czwartek 23 stycznia planujemy wycieczkę do Muzeum Przyrodniczego. Prosimy o przyprowadzenie dzieci do godziny 8:00 oraz wyposażenie ich w drugie śniadanie i wodę w bidonie.',
    requiresResponse: true,
  },
  {
    id: 'ann-002',
    title: 'Zebranie z rodzicami grupy "Motylki"',
    date: '2025-01-18',
    category: 'spotkanie',
    content:
      'Zapraszamy na zebranie podsumowujące semestr, które odbędzie się w poniedziałek 27 stycznia o godzinie 17:00 w sali nr 04. Będziemy omawiać postępy dzieci oraz plany na kolejny semestr.',
  },
  {
    id: 'ann-003',
    title: 'Dodatkowy strój na zajęcia sportowe',
    date: '2025-01-15',
    category: 'organizacyjne',
    content:
      'W środę 22 stycznia odbędą się zajęcia sportowe z trenerem. Prosimy o spakowanie stroju na gimnastykę (koszulka, spodenki, skarpetki antypoślizgowe) oraz podpisanie rzeczy dziecka.',
  },
  {
    id: 'ann-004',
    title: 'Projekt "Zima w mieście" – warsztaty plastyczne',
    date: '2025-01-12',
    category: 'organizacyjne',
    content:
      'W przyszłym tygodniu rozpoczynamy cykl warsztatów plastycznych. Prosimy o przyniesienie dodatkowego fartuszka lub koszulki do prac z farbami najpóźniej do wtorku.',
    defaultRead: true,
  },
  {
    id: 'ann-005',
    title: 'Spotkanie indywidualne z wychowawcą',
    date: '2025-01-10',
    category: 'spotkanie',
    content:
      'Rodziców, którzy chcieliby porozmawiać indywidualnie o postępach dziecka, prosimy o zgłoszenie takiej potrzeby do końca tygodnia. Ustalimy dogodny termin spotkania.',
  },
];

const statusChipStyles = {
  unread: 'bg-amber-100 text-amber-700 border border-amber-200',
  read: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

export default function OgloszeniaPage() {
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>(() =>
    announcementsSeed.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = Boolean(item.defaultRead);
      return acc;
    }, {})
  );
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});
  const [responseStatus, setResponseStatus] = useState<Record<string, 'none' | 'sent'>>(() =>
    announcementsSeed.reduce<Record<string, 'none' | 'sent'>>((acc, item) => {
      acc[item.id] = 'none';
      return acc;
    }, {})
  );
  const [openResponseId, setOpenResponseId] = useState<string | null>(null);

  const announcements = useMemo(
    () =>
      [...announcementsSeed].sort((a, b) => (a.date < b.date ? 1 : -1)), 
    []
  );

  const unreadCount = announcements.filter((item) => !statusMap[item.id]).length;

  const toggleStatus = (id: string) => {
    setStatusMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleResponse = (id: string, initial?: string) => {
    setOpenResponseId((prev) => (prev === id ? null : id));
    if (initial !== undefined) {
      setResponseDrafts((prev) => ({ ...prev, [id]: initial }));
    }
  };

  const handleSubmitResponse = (id: string) => {
    const message = (responseDrafts[id] || '').trim();
    if (message.length < 5) {
      alert('Odpowiedź powinna zawierać przynajmniej kilka słów.');
      return;
    }
    setResponseStatus((prev) => ({ ...prev, [id]: 'sent' }));
    setOpenResponseId(null);
    alert('Odpowiedź została wysłana do wychowawcy.');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Ogłoszenia</h1>
          <p className="text-sm text-gray-600">
            Bądź na bieżąco z informacjami o wyjściach, spotkaniach i ważnych komunikatach
            organizacyjnych.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700">
          <NotificationsActiveIcon className="text-blue-500" fontSize="small" />
          <span>
            Nieprzeczytane ogłoszenia:{' '}
            <strong className={unreadCount > 0 ? 'text-blue-600' : 'text-emerald-600'}>
              {unreadCount}
            </strong>
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-4 py-3 bg-gray-50 text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">
          <span>Status</span>
          <span>Tytuł i treść</span>
          <span>Kategoria</span>
          <span>Data</span>
        </div>

        <div className="divide-y divide-gray-100">
          {announcements.map((item) => {
            const isRead = Boolean(statusMap[item.id]);
            const category = categoryMeta[item.category];
            const CategoryIcon = category.icon;

            return (
              <div
                key={item.id}
                className={`grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_auto_auto] items-start gap-4 px-4 py-4 text-sm transition-colors ${
                  isRead ? 'bg-white' : 'bg-indigo-50/40'
                }`}
              >
                <div className="pt-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      isRead ? statusChipStyles.read : statusChipStyles.unread
                    }`}
                  >
                    {isRead ? (
                      <>
                        <DoneAllIcon fontSize="inherit" />
                        Odczytane
                      </>
                    ) : (
                      <>
                        <InfoIcon fontSize="inherit" />
                        Nowe
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-gray-900 font-semibold">{item.title}</h3>
                    {item.requiresResponse && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600 uppercase tracking-wide">
                        Wymagana odpowiedź
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.content}</p>
                  {item.requiresResponse && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-sm text-blue-900 space-y-3">
                      {responseStatus[item.id] === 'sent' && openResponseId !== item.id ? (
                        <div className="space-y-2">
                          <p className="font-medium flex items-center gap-2">
                            <DoneAllIcon fontSize="small" />
                            Odpowiedź wysłana
                          </p>
                          <p className="bg-white/60 border border-blue-100 rounded-md px-3 py-2 text-blue-800 whitespace-pre-wrap">
                            {responseDrafts[item.id]}
                          </p>
                          <button
                            onClick={() => toggleResponse(item.id, responseDrafts[item.id])}
                            className="inline-flex items-center gap-1 rounded-md border border-blue-300 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <EditIcon fontSize="inherit" />
                            Edytuj odpowiedź
                          </button>
                        </div>
                      ) : (
                        <>
                          {openResponseId === item.id ? (
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                                <ChatBubbleOutlineIcon fontSize="inherit" />
                                Twoja odpowiedź
                              </label>
                              <textarea
                                value={responseDrafts[item.id] ?? ''}
                                onChange={(e) =>
                                  setResponseDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                                }
                                rows={3}
                                className="w-full resize-none rounded-md border border-blue-200 bg-white px-3 py-2 text-blue-900 placeholder-blue-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Napisz krótką odpowiedź dla wychowawcy..."
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSubmitResponse(item.id)}
                                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                                >
                                  <SendIcon fontSize="inherit" />
                                  Wyślij odpowiedź
                                </button>
                                <button
                                  onClick={() => setOpenResponseId(null)}
                                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                  Anuluj
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleResponse(item.id)}
                              className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <ChatBubbleOutlineIcon fontSize="inherit" />
                              Odpowiedz na ogłoszenie
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-start md:justify-center">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${category.color}`}
                  >
                    <CategoryIcon fontSize="small" />
                    {category.label}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="text-xs text-gray-500 font-medium">
                    {new Date(item.date).toLocaleDateString('pl-PL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                  <button
                    onClick={() => toggleStatus(item.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {isRead ? (
                      <>
                        <UndoIcon fontSize="inherit" />
                        Oznacz jako nieprzeczytane
                      </>
                    ) : (
                      <>
                        <DoneAllIcon fontSize="inherit" />
                        Oznacz jako przeczytane
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

