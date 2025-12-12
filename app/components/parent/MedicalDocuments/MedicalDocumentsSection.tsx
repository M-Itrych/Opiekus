'use client';

import { useState, useEffect, useCallback } from 'react';
import { Add, Delete, Edit, Cancel, Save, Description, CloudUpload } from '@mui/icons-material';
import { Loader2 } from 'lucide-react';
import { UploadButton } from '@/lib/uploadthing';

interface MedicalDocument {
  id: string;
  childId: string;
  documentType: 'BIRTH_CERTIFICATE' | 'VACCINATION_CARD' | 'MEDICAL_EXAM' | 'OTHER';
  title: string;
  fileUrl: string;
  description: string | null;
  uploadDate: string;
  expiryDate: string | null;
}

interface MedicalDocumentsSectionProps {
  childId: string;
  canEdit?: boolean;
}

const documentTypeLabels: Record<string, string> = {
  BIRTH_CERTIFICATE: 'Akt urodzenia',
  VACCINATION_CARD: 'Karta szczepień',
  MEDICAL_EXAM: 'Badanie lekarskie',
  OTHER: 'Inny dokument',
};

export default function MedicalDocumentsSection({ childId, canEdit = true }: MedicalDocumentsSectionProps) {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    documentType: 'OTHER' as MedicalDocument['documentType'],
    description: '',
    expiryDate: '',
    fileUrl: '',
  });

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/medical-documents?childId=${childId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Error fetching medical documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const resetForm = () => {
    setFormData({
      title: '',
      documentType: 'OTHER',
      description: '',
      expiryDate: '',
      fileUrl: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.fileUrl) {
      setError('Tytuł i plik są wymagane');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const url = editingId 
        ? `/api/medical-documents/${editingId}` 
        : '/api/medical-documents';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          title: formData.title,
          documentType: formData.documentType,
          description: formData.description || null,
          expiryDate: formData.expiryDate || null,
          fileUrl: formData.fileUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas zapisywania');
      }

      await fetchDocuments();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (doc: MedicalDocument) => {
    setFormData({
      title: doc.title,
      documentType: doc.documentType,
      description: doc.description || '',
      expiryDate: doc.expiryDate ? doc.expiryDate.split('T')[0] : '',
      fileUrl: doc.fileUrl,
    });
    setEditingId(doc.id);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten dokument?')) return;

    try {
      const response = await fetch(`/api/medical-documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas usuwania');
      }

      await fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dokumenty medyczne</h3>
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Ładowanie dokumentów...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Dokumenty medyczne</h3>
        {canEdit && !isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-sm bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors"
          >
            <Add fontSize="small" />
            Dodaj dokument
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
            {editingId ? 'Edytuj dokument' : 'Nowy dokument medyczny'}
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tytuł dokumentu *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                placeholder="np. Zaświadczenie lekarskie"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ dokumentu
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value as MedicalDocument['documentType'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              >
                <option value="BIRTH_CERTIFICATE">Akt urodzenia</option>
                <option value="VACCINATION_CARD">Karta szczepień</option>
                <option value="MEDICAL_EXAM">Badanie lekarskie</option>
                <option value="OTHER">Inny dokument</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis (opcjonalnie)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                placeholder="Dodatkowe informacje o dokumencie"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data ważności (opcjonalnie)
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                max="9999-12-31"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plik dokumentu *
              </label>
              {formData.fileUrl ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <Description fontSize="small" className="text-green-600" />
                  <span className="text-sm text-green-700 flex-1 truncate">Plik został przesłany</span>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, fileUrl: '' }))}
                    className="text-red-500 hover:text-red-700"
                    type="button"
                  >
                    <Cancel fontSize="small" />
                  </button>
                </div>
              ) : (
                <UploadButton
                  endpoint="medicalDocumentUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      setFormData(prev => ({ ...prev, fileUrl: res[0].url }));
                    }
                  }}
                  onUploadError={(error: Error) => {
                    setError(`Błąd przesyłania: ${error.message}`);
                  }}
                  appearance={{
                    button: "bg-sky-500 hover:bg-sky-600 text-white text-sm px-4 py-2 rounded-md transition-colors ut-uploading:bg-sky-400",
                    allowedContent: "text-xs text-gray-500 mt-1",
                  }}
                  content={{
                    button({ ready, isUploading }) {
                      if (isUploading) return 'Przesyłanie...';
                      if (ready) return (
                        <span className="flex items-center gap-2">
                          <CloudUpload fontSize="small" />
                          Wybierz plik
                        </span>
                      );
                      return 'Przygotowywanie...';
                    },
                    allowedContent() {
                      return 'PDF lub obraz do 10MB';
                    },
                  }}
                />
              )}
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

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          <Description className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          Brak dokumentów medycznych
        </div>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Description className="h-5 w-5 text-sky-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{doc.title}</p>
                  <p className="text-xs text-sky-600">{documentTypeLabels[doc.documentType]}</p>
                  {doc.description && (
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{doc.description}</p>
                  )}
                  <div className="flex gap-4 mt-1">
                    <p className="text-xs text-gray-500">
                      Dodano: {new Date(doc.uploadDate).toLocaleDateString('pl-PL')}
                    </p>
                    {doc.expiryDate && (
                      <p className="text-xs text-amber-600">
                        Ważny do: {new Date(doc.expiryDate).toLocaleDateString('pl-PL')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Pobierz
                </a>
                {canEdit && (
                  <>
                    <button
                      onClick={() => handleEdit(doc)}
                      className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                      title="Edytuj"
                    >
                      <Edit fontSize="small" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Usuń"
                    >
                      <Delete fontSize="small" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

