'use client';

import { useState, useEffect, useCallback } from 'react';
import { Add, Delete, Edit, Cancel, Save, Psychology } from '@mui/icons-material';
import { Loader2 } from 'lucide-react';

interface Recommendation {
  id: string;
  childId: string;
  authorId: string;
  type: 'PSYCHOLOGIST' | 'PEDAGOGUE';
  content: string;
  date: string;
  author: {
    id: string;
    name: string;
    surname: string;
  };
}

interface RecommendationsSectionProps {
  childId: string;
  canEdit?: boolean;
  userRole?: string;
}

const typeLabels: Record<string, string> = {
  PSYCHOLOGIST: 'Psycholog',
  PEDAGOGUE: 'Pedagog',
};

export default function RecommendationsSection({ 
  childId, 
  canEdit = false,
  userRole = 'PARENT'
}: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    type: 'PSYCHOLOGIST' as Recommendation['type'],
    content: '',
    date: new Date().toISOString().split('T')[0],
  });

  const canManage = ['TEACHER', 'HEADTEACHER', 'ADMIN'].includes(userRole);

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/child-recommendations?childId=${childId}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const resetForm = () => {
    setFormData({
      type: 'PSYCHOLOGIST',
      content: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.content) {
      setError('Treść zalecenia jest wymagana');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const url = editingId 
        ? `/api/child-recommendations/${editingId}` 
        : '/api/child-recommendations';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          type: formData.type,
          content: formData.content,
          date: formData.date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas zapisywania');
      }

      await fetchRecommendations();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (rec: Recommendation) => {
    setFormData({
      type: rec.type,
      content: rec.content,
      date: rec.date.split('T')[0],
    });
    setEditingId(rec.id);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to zalecenie?')) return;

    try {
      const response = await fetch(`/api/child-recommendations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas usuwania');
      }

      await fetchRecommendations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Zalecenia psychologa/pedagoga</h3>
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
        <h3 className="text-lg font-semibold text-gray-800">Zalecenia psychologa/pedagoga</h3>
        {canManage && canEdit && !isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-sm bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors"
          >
            <Add fontSize="small" />
            Dodaj zalecenie
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
            {editingId ? 'Edytuj zalecenie' : 'Nowe zalecenie'}
          </h4>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ zalecenia *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Recommendation['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                >
                  <option value="PSYCHOLOGIST">Psycholog</option>
                  <option value="PEDAGOGUE">Pedagog</option>
                </select>
              </div>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treść zalecenia *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                placeholder="Wprowadź treść zalecenia..."
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

      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          <Psychology className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          Brak zaleceń psychologa/pedagoga
        </div>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((rec) => (
            <li
              key={rec.id}
              className="rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Psychology className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        rec.type === 'PSYCHOLOGIST' 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-teal-100 text-teal-700'
                      }`}>
                        {typeLabels[rec.type]}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(rec.date).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{rec.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Autor: {rec.author.name} {rec.author.surname}
                    </p>
                  </div>
                </div>
                {canManage && canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(rec)}
                      className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                      title="Edytuj"
                    >
                      <Edit fontSize="small" />
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
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

