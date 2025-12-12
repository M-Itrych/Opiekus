'use client';

import { useState, useEffect, useCallback } from 'react';
import { Add, Delete, Edit, Cancel, Save, EmojiPeople } from '@mui/icons-material';
import { Loader2 } from 'lucide-react';

interface BehavioralInfo {
  id: string;
  childId: string;
  authorId: string;
  date: string;
  behavior: string;
  context: string | null;
  notes: string | null;
  author: {
    id: string;
    name: string;
    surname: string;
  };
}

interface BehavioralInfoSectionProps {
  childId: string;
  canEdit?: boolean;
  userRole?: string;
}

export default function BehavioralInfoSection({ 
  childId, 
  canEdit = false,
  userRole = 'PARENT'
}: BehavioralInfoSectionProps) {
  const [behavioralInfos, setBehavioralInfos] = useState<BehavioralInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    behavior: '',
    context: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const canManage = ['TEACHER', 'HEADTEACHER', 'ADMIN'].includes(userRole);

  const fetchBehavioralInfos = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/behavioral-info?childId=${childId}`);
      if (response.ok) {
        const data = await response.json();
        setBehavioralInfos(data);
      }
    } catch (err) {
      console.error('Error fetching behavioral info:', err);
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchBehavioralInfos();
  }, [fetchBehavioralInfos]);

  const resetForm = () => {
    setFormData({
      behavior: '',
      context: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.behavior) {
      setError('Opis zachowania jest wymagany');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const url = editingId 
        ? `/api/behavioral-info/${editingId}` 
        : '/api/behavioral-info';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          behavior: formData.behavior,
          context: formData.context || null,
          notes: formData.notes || null,
          date: formData.date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas zapisywania');
      }

      await fetchBehavioralInfos();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (info: BehavioralInfo) => {
    setFormData({
      behavior: info.behavior,
      context: info.context || '',
      notes: info.notes || '',
      date: info.date.split('T')[0],
    });
    setEditingId(info.id);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpis?')) return;

    try {
      const response = await fetch(`/api/behavioral-info/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas usuwania');
      }

      await fetchBehavioralInfos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Informacje behawioralne</h3>
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Ładowanie...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Informacje behawioralne</h3>
        {canManage && canEdit && !isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-sm bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors"
          >
            <Add fontSize="small" />
            Dodaj wpis
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <Cancel fontSize="small" />
          </button>
        </div>
      )}

      {(isAdding || editingId) && canManage && (
        <div className="mb-4 p-4 bg-sky-50 rounded-lg border border-sky-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {editingId ? 'Edytuj wpis' : 'Nowy wpis behawioralny'}
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                max="9999-12-31"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis zachowania *
              </label>
              <textarea
                value={formData.behavior}
                onChange={(e) => setFormData(prev => ({ ...prev, behavior: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                placeholder="Opisz zaobserwowane zachowanie..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kontekst sytuacji
              </label>
              <textarea
                value={formData.context}
                onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                placeholder="W jakiej sytuacji to wystąpiło..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notatki
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                placeholder="Dodatkowe obserwacje, zalecenia..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors disabled:bg-sky-300 text-sm"
              >
                <Save fontSize="small" />
                {isSaving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
              <button
                onClick={resetForm}
                disabled={isSaving}
                className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300 text-sm"
              >
                <Cancel fontSize="small" />
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {behavioralInfos.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          <EmojiPeople className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          Brak informacji behawioralnych
        </div>
      ) : (
        <ul className="space-y-3">
          {behavioralInfos.map((info) => (
            <li
              key={info.id}
              className="rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <EmojiPeople className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {new Date(info.date).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{info.behavior}</p>
                    {info.context && (
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Kontekst:</span> {info.context}
                      </p>
                    )}
                    {info.notes && (
                      <p className="text-xs text-amber-700 mt-1 italic">{info.notes}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Autor: {info.author.name} {info.author.surname}
                    </p>
                  </div>
                </div>
                {canManage && canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(info)}
                      className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                      title="Edytuj"
                    >
                      <Edit fontSize="small" />
                    </button>
                    <button
                      onClick={() => handleDelete(info.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Usuń"
                    >
                      <Delete fontSize="small" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

