'use client';

import { useState, useEffect, useCallback } from 'react';
import { Edit, Save, Cancel, Download, Add, Person } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { Loader2, FileText } from 'lucide-react';
import MedicalDocumentsSection from '@/app/components/parent/MedicalDocuments/MedicalDocumentsSection';
import ChronicDiseasesSection from '@/app/components/parent/ChronicDiseases/ChronicDiseasesSection';
import MedicationsSection from '@/app/components/parent/Medications/MedicationsSection';
import RecommendationsSection from '@/app/components/parent/Recommendations/RecommendationsSection';
import BehavioralInfoSection from '@/app/components/parent/BehavioralInfo/BehavioralInfoSection';

interface Child {
  id: string;
  name: string;
  surname: string;
  age: number;
  hasImageConsent: boolean;
  hasDataConsent: boolean;
  allergies: string[];
  specialNeeds: string | null;
  pesel: string | null;
  birthDate: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  group: {
    id: string;
    name: string;
  } | null;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  status: 'AKTYWNY' | 'ARCHIWALNY';
  createdAt: string;
}

interface ChildFormData {
  name: string;
  surname: string;
  age: string;
  allergies: string;
  specialNeeds: string;
  hasImageConsent: boolean;
  hasDataConsent: boolean;
  pesel: string;
  birthDate: string;
  address: string;
  city: string;
  postalCode: string;
}

const emptyFormData: ChildFormData = {
  name: '',
  surname: '',
  age: '',
  allergies: '',
  specialNeeds: '',
  hasImageConsent: false,
  hasDataConsent: false,
  pesel: '',
  birthDate: '',
  address: '',
  city: '',
  postalCode: '',
};

export default function DzieckoPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [formData, setFormData] = useState<ChildFormData>(emptyFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch('/api/documents?status=aktywny');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  const fetchChildren = useCallback(async (selectFirst = false) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/children');
      if (!response.ok) {
        throw new Error('Błąd podczas pobierania danych');
      }
      const data = await response.json();
      setChildren(data);
      if (selectFirst && data.length > 0) {
        setSelectedChildId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren(true);
    fetchDocuments();
  }, [fetchChildren, fetchDocuments]);

  const selectedChild = children.find(c => c.id === selectedChildId);

  const handleEditStart = () => {
    if (selectedChild) {
      setFormData({
        name: selectedChild.name,
        surname: selectedChild.surname,
        age: selectedChild.age.toString(),
        allergies: selectedChild.allergies.join(', '),
        specialNeeds: selectedChild.specialNeeds || '',
        hasImageConsent: selectedChild.hasImageConsent,
        hasDataConsent: selectedChild.hasDataConsent,
        pesel: selectedChild.pesel || '',
        birthDate: selectedChild.birthDate ? selectedChild.birthDate.split('T')[0] : '',
        address: selectedChild.address || '',
        city: selectedChild.city || '',
        postalCode: selectedChild.postalCode || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!selectedChild) return;
    
    try {
      setIsSaving(true);
      const response = await fetch(`/api/children/${selectedChild.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          age: formData.birthDate ? undefined : parseInt(formData.age),
          allergies: formData.allergies.split(',').map(a => a.trim()).filter(Boolean),
          specialNeeds: formData.specialNeeds.trim() || null,
          hasImageConsent: formData.hasImageConsent,
          hasDataConsent: formData.hasDataConsent,
          pesel: formData.pesel.trim() || null,
          birthDate: formData.birthDate || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          postalCode: formData.postalCode.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas zapisywania');
      }

      await fetchChildren();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(emptyFormData);
    setIsEditing(false);
    setIsAddingChild(false);
  };

  const handleAddChildStart = () => {
    setFormData(emptyFormData);
    setIsAddingChild(true);
    setIsEditing(false);
  };

  const handleAddChild = async () => {
    if (!formData.name || !formData.surname || !formData.birthDate) {
      setError('Imię, nazwisko i data urodzenia są wymagane');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          birthDate: formData.birthDate,
          allergies: formData.allergies.split(',').map(a => a.trim()).filter(Boolean),
          specialNeeds: formData.specialNeeds.trim() || null,
          hasImageConsent: formData.hasImageConsent,
          hasDataConsent: formData.hasDataConsent,
          pesel: formData.pesel.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          postalCode: formData.postalCode.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas dodawania dziecka');
      }

      const newChild = await response.json();
      await fetchChildren();
      setSelectedChildId(newChild.id);
      setIsAddingChild(false);
      setFormData(emptyFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsSaving(false);
    }
  };

  const formatPostalCode = (value: string): string => {
    // Usuń wszystkie znaki niebędące cyframi
    const digits = value.replace(/\D/g, '');
    
    // Jeśli są 2 lub więcej cyfr, dodaj myślnik po 2 cyfrach
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}`;
    }
    
    return digits;
  };

  const handleInputChange = (field: keyof ChildFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePostalCodeChange = (value: string) => {
    const formatted = formatPostalCode(value);
    handleInputChange('postalCode', formatted);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <Cancel fontSize="small" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Moje dzieci</h1>
        <button
          onClick={handleAddChildStart}
          className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
          disabled={isAddingChild || isEditing}
        >
          <Add fontSize="small" />
          Dodaj dziecko
        </button>
      </div>

      {children.length > 0 && !isAddingChild && (
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => {
                  if (!isEditing) {
                    setSelectedChildId(child.id);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  selectedChildId === child.id
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isEditing}
              >
                <Person fontSize="small" />
                {child.name} {child.surname}
              </button>
            ))}
          </div>
        </div>
      )}

      {isAddingChild && (
        <div className="mb-6 p-6 bg-sky-50 rounded-lg border border-sky-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Dodaj nowe dziecko</h2>
            <div className="flex gap-2">
              <button
                onClick={handleAddChild}
                disabled={isSaving}
                className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors disabled:bg-sky-300"
              >
                <Save fontSize="small" />
                {isSaving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300"
              >
                <Cancel fontSize="small" />
                Anuluj
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imię *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwisko *
              </label>
              <input
                type="text"
                value={formData.surname}
                onChange={(e) => handleInputChange('surname', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data urodzenia *
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PESEL
              </label>
              <input
                type="text"
                value={formData.pesel}
                onChange={(e) => handleInputChange('pesel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="00000000000"
                maxLength={11}
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres zamieszkania
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="ul. Przykładowa 1/2"
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Miasto
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Warszawa"
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kod pocztowy
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handlePostalCodeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="00-000"
                maxLength={6}
                pattern="[0-9]{2}-[0-9]{3}"
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alergeny (oddzielone przecinkami)
              </label>
              <textarea
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="np. orzechy, mleko, gluten"
              />
            </div>

            <div className="md:col-span-2 bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specjalne potrzeby
              </label>
              <textarea
                value={formData.specialNeeds}
                onChange={(e) => handleInputChange('specialNeeds', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Opisz specjalne potrzeby dziecka (opcjonalnie)"
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasImageConsent}
                  onChange={(e) => handleInputChange('hasImageConsent', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <span className="block text-sm font-medium text-gray-700">Zgoda na zdjęcia</span>
                  <span className="block text-xs text-gray-500 mt-1">Wyrażam zgodę na publikowanie zdjęć dziecka w galerii przedszkolnej</span>
                </div>
              </label>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasDataConsent}
                  onChange={(e) => handleInputChange('hasDataConsent', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <span className="block text-sm font-medium text-gray-700">Zgoda na przetwarzanie danych</span>
                  <span className="block text-xs text-gray-500 mt-1">Wyrażam zgodę na przetwarzanie danych osobowych dziecka</span>
                </div>
              </label>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            * Pola wymagane. Grupa zostanie przydzielona przez dyrektora przedszkola.</p>
        </div>
      )}

      {selectedChild && !isAddingChild && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Dane dziecka: {selectedChild.name} {selectedChild.surname}
            </h2>
            {!isEditing ? (
              <button
                onClick={handleEditStart}
                className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
              >
                <Edit fontSize="small" />
                Edytuj dane
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors disabled:bg-sky-300"
                >
                  <Save fontSize="small" />
                  {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300"
                >
                  <Cancel fontSize="small" />
                  Anuluj
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imię
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              ) : (
                <p className="text-gray-900">{selectedChild.name}</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwisko
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.surname}
                  onChange={(e) => handleInputChange('surname', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              ) : (
                <p className="text-gray-900">{selectedChild.surname}</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data urodzenia
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              ) : (
                <p className="text-gray-900">
                  {selectedChild.birthDate 
                    ? new Date(selectedChild.birthDate).toLocaleDateString('pl-PL')
                    : 'Nie podano'}
                </p>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wiek
              </label>
              <p className="text-gray-900">{selectedChild.age} lat</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PESEL
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.pesel}
                  onChange={(e) => handleInputChange('pesel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="00000000000"
                  maxLength={11}
                />
              ) : (
                <p className="text-gray-900">{selectedChild.pesel || 'Nie podano'}</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grupa
              </label>
              <p className="text-gray-900">
                {selectedChild.group?.name || 'Nieprzypisana (oczekuje na decyzję dyrektora)'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres zamieszkania
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="ul. Przykładowa 1/2"
                />
              ) : (
                <p className="text-gray-900">{selectedChild.address || 'Nie podano'}</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Miasto
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Warszawa"
                />
              ) : (
                <p className="text-gray-900">{selectedChild.city || 'Nie podano'}</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kod pocztowy
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handlePostalCodeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="00-000"
                  maxLength={6}
                />
              ) : (
                <p className="text-gray-900">{selectedChild.postalCode || 'Nie podano'}</p>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alergeny
              </label>
              {isEditing ? (
                <textarea
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="np. orzechy, mleko, gluten"
                />
              ) : (
                <p className="text-gray-900">
                  {selectedChild.allergies.length > 0 
                    ? selectedChild.allergies.join(', ') 
                    : 'Brak'}
                </p>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specjalne potrzeby
              </label>
              {isEditing ? (
                <textarea
                  value={formData.specialNeeds}
                  onChange={(e) => handleInputChange('specialNeeds', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              ) : (
                <p className="text-gray-900">
                  {selectedChild.specialNeeds || 'Brak'}
                </p>
              )}
            </div>

            {isEditing && (
              <>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasImageConsent}
                      onChange={(e) => handleInputChange('hasImageConsent', e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Zgoda na zdjęcia</span>
                      <span className="block text-xs text-gray-500 mt-1">Wyrażam zgodę na publikowanie zdjęć dziecka w galerii przedszkolnej</span>
                    </div>
                  </label>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasDataConsent}
                      onChange={(e) => handleInputChange('hasDataConsent', e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Zgoda na przetwarzanie danych</span>
                      <span className="block text-xs text-gray-500 mt-1">Wyrażam zgodę na przetwarzanie danych osobowych dziecka</span>
                    </div>
                  </label>
                </div>
              </>
            )}

            {!isEditing && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zgoda na zdjęcia
                  </label>
                  <div className="flex items-center gap-2">
                    {selectedChild.hasImageConsent ? (
                      <>
                        <CheckCircleIcon className="text-emerald-500" fontSize="small" />
                        <span className="text-emerald-600">Wyrażona</span>
                      </>
                    ) : (
                      <>
                        <HighlightOffIcon className="text-amber-500" fontSize="small" />
                        <span className="text-amber-600">Niewyrażona</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zgoda na przetwarzanie danych
                  </label>
                  <div className="flex items-center gap-2">
                    {selectedChild.hasDataConsent ? (
                      <>
                        <CheckCircleIcon className="text-emerald-500" fontSize="small" />
                        <span className="text-emerald-600">Wyrażona</span>
                      </>
                    ) : (
                      <>
                        <HighlightOffIcon className="text-amber-500" fontSize="small" />
                        <span className="text-amber-600">Niewyrażona</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {children.length === 0 && !isAddingChild && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Person className="text-gray-400 mb-4" style={{ fontSize: 48 }} />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Nie masz jeszcze dodanych dzieci
          </h3>
          <p className="text-gray-500 mb-4">
            Kliknij przycisk &quot;Dodaj dziecko&quot; aby zarejestrować dziecko w systemie.
          </p>
          <button
            onClick={handleAddChildStart}
            className="inline-flex items-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 transition-colors"
          >
            <Add fontSize="small" />
            Dodaj dziecko
          </button>
        </div>
      )}

      {selectedChild && !isAddingChild && (
        <div className="mt-8 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Dokumenty do pobrania</h3>
            {!loadingDocuments && (
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                {documents.length} {documents.length === 1 ? 'plik' : 'pliki'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Poniżej znajdziesz dokumenty związane z pobytem dziecka w placówce. Kliknij &quot;Pobierz&quot;,
            aby zapisać dokument na swoim urządzeniu.
          </p>
          
          {loadingDocuments ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Ładowanie dokumentów...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              Brak dokumentów do wyświetlenia
            </div>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-sky-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{doc.title}</p>
                      {doc.description && (
                        <p className="text-xs text-gray-600 mt-0.5">{doc.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Dodano: {new Date(doc.createdAt).toLocaleDateString('pl-PL')}
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <Download fontSize="small" />
                    Pobierz
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sekcje medyczne i behawioralne */}
      {selectedChild && !isAddingChild && !isEditing && (
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Dane medyczne i behawioralne</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MedicalDocumentsSection childId={selectedChild.id} canEdit={true} />
            <ChronicDiseasesSection childId={selectedChild.id} canEdit={true} />
          </div>
          
          <MedicationsSection childId={selectedChild.id} canEdit={true} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecommendationsSection childId={selectedChild.id} canEdit={false} userRole="PARENT" />
            <BehavioralInfoSection childId={selectedChild.id} canEdit={false} userRole="PARENT" />
          </div>
        </div>
      )}
    </div>
  );
}
