'use client';

import { useState, useEffect, useCallback } from 'react';
import { Add, Delete, Edit, Cancel, Save, LocalHospital } from '@mui/icons-material';
import { Loader2 } from 'lucide-react';

interface ChronicDisease {
  id: string;
  childId: string;
  name: string;
  description: string | null;
  diagnosedAt: string | null;
  notes: string | null;
}

interface ChronicDiseasesSectionProps {
  childId: string;
  canEdit?: boolean;
}

export default function ChronicDiseasesSection({ childId, canEdit = true }: ChronicDiseasesSectionProps) {
  const [diseases, setDiseases] = useState<ChronicDisease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    diagnosedAt: '',
    notes: '',
  });

  const fetchDiseases = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chronic-diseases?childId=${childId}`);
      if (response.ok) {
        const data = await response.json();
        setDiseases(data);
      }
    } catch (err) {
      console.error('Error fetching chronic diseases:', err);
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchDiseases();
  }, [fetchDiseases]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      diagnosedAt: '',
      notes: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name) {
      setError('Nazwa choroby jest wymagana');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const url = editingId 
        ? `/api/chronic-diseases/${editingId}` 
        : '/api/chronic-diseases';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          name: formData.name,
          description: formData.description || null,
          diagnosedAt: formData.diagnosedAt || null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas zapisywania');
      }

      await fetchDiseases();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (disease: ChronicDisease) => {
    setFormData({
      name: disease.name,
      description: disease.description || '',
      diagnosedAt: disease.diagnosedAt ? disease.diagnosedAt.split('T')[0] : '',
      notes: disease.notes || '',
    });
    setEditingId(disease.id);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpis?')) return;

    try {
      const response = await fetch(`/api/chronic-diseases/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas usuwania');
      }

      await fetchDiseases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Choroby przewlekłe</h3>
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
        <h3 className="text-lg font-semibold text-gray-800">Choroby przewlekłe</h3>
        {canEdit && !isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-sm bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors"
          >
            <Add fontSize="small" />
            Dodaj
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

      {(isAdding || editingId) && (
        <div className="mb-4 p-4 bg-sky-50 rounded-lg border border-sky-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {editingId ? 'Edytuj chorobę' : 'Nowa choroba przewlekła'}
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa choroby *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                placeholder="np. Astma, Cukrzyca"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                placeholder="Szczegółowy opis choroby"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data diagnozy
              </label>
              <input
                type="date"
                value={formData.diagnosedAt}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnosedAt: e.target.value }))}
                max="9999-12-31"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
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
                placeholder="Dodatkowe informacje, zalecenia"
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

      {diseases.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          <LocalHospital className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          Brak wpisów o chorobach przewlekłych
        </div>
      ) : (
        <ul className="space-y-3">
          {diseases.map((disease) => (
            <li
              key={disease.id}
              className="rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <LocalHospital className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{disease.name}</p>
                    {disease.description && (
                      <p className="text-xs text-gray-600 mt-0.5">{disease.description}</p>
                    )}
                    {disease.diagnosedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Zdiagnozowano: {new Date(disease.diagnosedAt).toLocaleDateString('pl-PL')}
                      </p>
                    )}
                    {disease.notes && (
                      <p className="text-xs text-amber-700 mt-1 italic">{disease.notes}</p>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(disease)}
                      className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                      title="Edytuj"
                    >
                      <Edit fontSize="small" />
                    </button>
                    <button
                      onClick={() => handleDelete(disease.id)}
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

