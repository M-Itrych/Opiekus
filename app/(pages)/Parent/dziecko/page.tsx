'use client';

import { useState } from 'react';
import { Edit, Save, Cancel, Download } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ParentLayout from '@/app/components/global/Layout/ParentLayout';

export default function DzieckoPage() {
  const [isEditing, setIsEditing] = useState(false);
  
  const [childData, setChildData] = useState({
    imie: 'Anna',
    nazwisko: 'Kowalska',
    grupa: 'Motylki',
    rodzic1: 'Agnieszka Kowalska',
    rodzic2: 'Piotr Kowalski',
    telefon: '+48 123 456 789',
    alergeny: 'Orzechy, truskawki'
  });

  const [tempData, setTempData] = useState(childData);
  const [documentsConsent, setDocumentsConsent] = useState(true);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);

  const documents = [
    {
      id: 'doc-2025-01-01',
      title: 'Decyzja o przyjęciu do przedszkola',
      date: '2025-01-10',
      url: '#',
    },
    {
      id: 'doc-2024-09-15',
      title: 'Regulamin zajęć dodatkowych',
      date: '2024-09-15',
      url: '#',
    },
    {
      id: 'doc-2024-06-01',
      title: 'Zgoda na udział w wycieczce',
      date: '2024-06-01',
      url: '#',
    },
  ];

  const handleSave = () => {
    setChildData(tempData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempData(childData);
    setIsEditing(false);
  };

  const Field = ({ label, value, fieldName }: { label: string; value: string; fieldName: string }) => (
    <div className="bg-white p-4 rounded-lg border border-zinc-200">
      <label className="block text-sm font-medium text-zinc-700 mb-2">
        {label}
      </label>
      {isEditing ? (
        <input
          type="text"
          value={tempData[fieldName as keyof typeof tempData]}
          onChange={(e) => setTempData(prev => ({ ...prev, [fieldName]: e.target.value }))}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      ) : (
        <p className="text-zinc-900">{value}</p>
      )}
    </div>
  );

  return (
    <ParentLayout
      title="Moje dziecko"
      description="Zarządzanie danymi dziecka i dokumentami"
      headerAction={
        !isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Edit fontSize="small" />
            Edytuj dane
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Save fontSize="small" />
              Zapisz
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-zinc-500 text-white px-4 py-2 rounded-lg hover:bg-zinc-600 transition-colors"
            >
              <Cancel fontSize="small" />
              Anuluj
            </button>
          </div>
        )
      }
    >

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Imię" value={childData.imie} fieldName="imie" />
        <Field label="Nazwisko" value={childData.nazwisko} fieldName="nazwisko" />
        <Field label="Grupa" value={childData.grupa} fieldName="grupa" />
        <Field label="Telefon kontaktowy" value={childData.telefon} fieldName="telefon" />
        
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-zinc-200">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Rodzice / Opiekunowie
            </label>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={tempData.rodzic1}
                  onChange={(e) => setTempData(prev => ({ ...prev, rodzic1: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Rodzic 1"
                />
                <input
                  type="text"
                  value={tempData.rodzic2}
                  onChange={(e) => setTempData(prev => ({ ...prev, rodzic2: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Rodzic 2"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-zinc-900">{childData.rodzic1}</p>
                <p className="text-zinc-900">{childData.rodzic2}</p>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border border-zinc-200">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Alergeny i uwagi zdrowotne
            </label>
            {isEditing ? (
              <textarea
                value={tempData.alergeny}
                onChange={(e) => setTempData(prev => ({ ...prev, alergeny: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Wpisz alergeny lub inne uwagi zdrowotne..."
              />
            ) : (
              <p className="text-zinc-900 whitespace-pre-wrap">
                {childData.alergeny || 'Brak alergenów'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900 mb-3">
            Zgoda na dokumenty elektroniczne
          </h3>
          <p className="text-sm text-zinc-600 mb-4">
            Wyrażenie zgody pozwala na przesyłanie decyzji, regulaminów i innych ważnych dokumentów
            drogą elektroniczną na wskazany adres e-mail.
          </p>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 flex items-center gap-3">
            {documentsConsent ? (
              <CheckCircleIcon className="text-emerald-500" />
            ) : (
              <HighlightOffIcon className="text-amber-500" />
            )}
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {documentsConsent
                  ? 'Zgoda na otrzymywanie dokumentów elektronicznych jest włączona.'
                  : 'Zgoda na otrzymywanie dokumentów elektronicznych jest wyłączona.'}
              </p>
              <p className="text-xs text-zinc-500">
                Możesz w dowolnym momencie zmienić swoją decyzję.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isUpdatingConsent) return;
              setIsUpdatingConsent(true);
              setTimeout(() => {
                setDocumentsConsent((prev) => !prev);
                setIsUpdatingConsent(false);
              }, 800);
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors disabled:bg-sky-300 disabled:cursor-not-allowed"
            disabled={isUpdatingConsent}
          >
            {isUpdatingConsent ? 'Aktualizowanie...' : documentsConsent ? 'Wyłącz zgodę' : 'Włącz zgodę'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-zinc-900">Dokumenty do pobrania</h3>
            <span className="text-xs text-zinc-500 uppercase tracking-wide">
              {documents.length} pliki
            </span>
          </div>
          <p className="text-sm text-zinc-600 mb-4">
            Poniżej znajdziesz dokumenty związane z pobytem dziecka w placówce. Kliknij „Pobierz",
            aby zapisać dokument na swoim urządzeniu.
          </p>
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3 hover:bg-zinc-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{doc.title}</p>
                  <p className="text-xs text-zinc-500">
                    Dodano: {new Date(doc.date).toLocaleDateString('pl-PL')}
                  </p>
                </div>
                <a
                  href={doc.url}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                  download
                >
                  <Download fontSize="small" />
                  Pobierz
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ParentLayout>
  );
}