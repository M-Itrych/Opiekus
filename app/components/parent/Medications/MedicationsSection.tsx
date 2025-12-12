'use client';

import { useState, useEffect, useCallback } from 'react';
import { Add, Delete, Edit, Cancel, Save, Medication } from '@mui/icons-material';
import { Loader2 } from 'lucide-react';

interface MedicationItem {
  id: string;
  childId: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
}

interface MedicationsSectionProps {
  childId: string;
  canEdit?: boolean;
}

export default function MedicationsSection({ childId, canEdit = true }: MedicationsSectionProps) {
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  const fetchMedications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/medications?childId=${childId}`);
      if (response.ok) {
        const data = await response.json();
        setMedications(data);
      }
    } catch (err) {
      console.error('Error fetching medications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      frequency: '',
      startDate: '',
      endDate: '',
      notes: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name) {
      setError('Nazwa leku jest wymagana');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const url = editingId 
        ? `/api/medications/${editingId}` 
        : '/api/medications';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          name: formData.name,
          dosage: formData.dosage || null,
          frequency: formData.frequency || null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas zapisywania');
      }

      await fetchMedications();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (medication: MedicationItem) => {
    setFormData({
      name: medication.name,
      dosage: medication.dosage || '',
      frequency: medication.frequency || '',
      startDate: medication.startDate ? medication.startDate.split('T')[0] : '',
      endDate: medication.endDate ? medication.endDate.split('T')[0] : '',
      notes: medication.notes || '',
    });
    setEditingId(medication.id);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpis?')) return;

    try {
      const response = await fetch(`/api/medications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas usuwania');
      }

      await fetchMedications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Leki</h3>
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
        <h3 className="text-lg font-semibold text-gray-800">Leki</h3>
        {canEdit && !isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-sm bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors"
          >
            <Add fontSize="small" />
            Dodaj lek
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
            {editingId ? 'Edytuj lek' : 'Nowy lek'}
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa leku *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                placeholder="np. Ventolin, Insulina"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dawkowanie
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  placeholder="np. 2 dawki"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Częstotliwość
                </label>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  placeholder="np. 2x dziennie"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data rozpoczęcia
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  max="9999-12-31"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data zakończenia
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  max="9999-12-31"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
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

      {medications.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          <Medication className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          Brak wpisów o lekach
        </div>
      ) : (
        <ul className="space-y-3">
          {medications.map((medication) => (
            <li
              key={medication.id}
              className="rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Medication className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{medication.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {medication.dosage && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          {medication.dosage}
                        </span>
                      )}
                      {medication.frequency && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {medication.frequency}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      {medication.startDate && (
                        <span>Od: {new Date(medication.startDate).toLocaleDateString('pl-PL')}</span>
                      )}
                      {medication.endDate && (
                        <span>Do: {new Date(medication.endDate).toLocaleDateString('pl-PL')}</span>
                      )}
                    </div>
                    {medication.notes && (
                      <p className="text-xs text-gray-600 mt-1 italic">{medication.notes}</p>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(medication)}
                      className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                      title="Edytuj"
                    >
                      <Edit fontSize="small" />
                    </button>
                    <button
                      onClick={() => handleDelete(medication.id)}
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

