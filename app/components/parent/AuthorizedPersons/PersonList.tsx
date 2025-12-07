"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  User,
  Phone,
  CreditCard,
  Loader2,
  RefreshCw,
  X,
  Edit2,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuthorizedPerson {
  id: string;
  childId: string;
  name: string;
  surname: string;
  relation: string;
  phone: string | null;
  idNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Child {
  id: string;
  name: string;
  surname: string;
}

export default function PersonList() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [authorizedPersons, setAuthorizedPersons] = useState<AuthorizedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newPerson, setNewPerson] = useState({
    name: "",
    surname: "",
    relation: "",
    phone: "",
    idNumber: "",
  });

  const [editPerson, setEditPerson] = useState({
    name: "",
    surname: "",
    relation: "",
    phone: "",
    idNumber: "",
  });

  const fetchChildren = useCallback(async () => {
    try {
      const res = await fetch("/api/children");
      if (!res.ok) throw new Error("Błąd pobierania dzieci");
      const data = await res.json();
      setChildren(data);
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać listy dzieci");
    }
  }, [selectedChildId]);

  const fetchAuthorizedPersons = useCallback(async () => {
    if (!selectedChildId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/children/${selectedChildId}/authorized-persons`);
      if (!res.ok) throw new Error("Błąd pobierania osób upoważnionych");
      const data = await res.json();
      setAuthorizedPersons(data);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać osób upoważnionych");
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (selectedChildId) {
      fetchAuthorizedPersons();
    }
  }, [selectedChildId, fetchAuthorizedPersons]);

  const handleAddPerson = async () => {
    if (!newPerson.name || !newPerson.surname || !newPerson.relation) {
      setError("Imię, nazwisko i relacja są wymagane");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/children/${selectedChildId}/authorized-persons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPerson),
      });

      if (!res.ok) throw new Error("Błąd dodawania osoby");

      setNewPerson({ name: "", surname: "", relation: "", phone: "", idNumber: "" });
      setShowAddForm(false);
      await fetchAuthorizedPersons();
    } catch (err) {
      console.error(err);
      setError("Nie udało się dodać osoby upoważnionej");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (person: AuthorizedPerson) => {
    setEditingId(person.id);
    setEditPerson({
      name: person.name,
      surname: person.surname,
      relation: person.relation,
      phone: person.phone || "",
      idNumber: person.idNumber || "",
    });
  };

  const handleSaveEdit = async (personId: string) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/authorized-persons/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPerson),
      });

      if (!res.ok) throw new Error("Błąd aktualizacji");

      setEditingId(null);
      await fetchAuthorizedPersons();
    } catch (err) {
      console.error(err);
      setError("Nie udało się zaktualizować osoby");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (personId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę osobę z listy upoważnionych?")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/authorized-persons/${personId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Błąd usuwania");

      await fetchAuthorizedPersons();
    } catch (err) {
      console.error(err);
      setError("Nie udało się usunąć osoby");
    } finally {
      setSaving(false);
    }
  };

  const relationOptions = [
    "Babcia",
    "Dziadek",
    "Ciocia",
    "Wujek",
    "Opiekunka",
    "Rodzeństwo",
    "Inna osoba",
  ];

  if (children.length === 0 && !loading) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nie masz przypisanych dzieci</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Osoby upoważnione do odbioru
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Zarządzaj osobami, które mogą odbierać Twoje dziecko z przedszkola
          </p>
        </div>
        <div className="flex items-center gap-2">
          {children.length > 1 && (
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Wybierz dziecko" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name} {child.surname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-sky-600 hover:bg-sky-700"
            disabled={!selectedChildId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Dodaj osobę
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
              Dodaj nową osobę upoważnioną
            </h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAddForm(false)}
              aria-label="Zamknij formularz"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="Imię *"
              value={newPerson.name}
              onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
            />
            <Input
              placeholder="Nazwisko *"
              value={newPerson.surname}
              onChange={(e) => setNewPerson({ ...newPerson, surname: e.target.value })}
            />
            <Select
              value={newPerson.relation}
              onValueChange={(value) => setNewPerson({ ...newPerson, relation: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Relacja *" />
              </SelectTrigger>
              <SelectContent>
                {relationOptions.map((rel) => (
                  <SelectItem key={rel} value={rel}>
                    {rel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Telefon"
              value={newPerson.phone}
              onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
            />
            <Input
              placeholder="Nr dowodu osobistego"
              value={newPerson.idNumber}
              onChange={(e) => setNewPerson({ ...newPerson, idNumber: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleAddPerson}
              disabled={saving}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Dodaj
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      ) : authorizedPersons.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Brak osób upoważnionych do odbioru</p>
          <p className="text-sm mt-1">Dodaj osoby, które mogą odbierać dziecko z przedszkola</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {authorizedPersons.map((person) => (
            <div
              key={person.id}
              className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
            >
              {editingId === person.id ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      placeholder="Imię"
                      value={editPerson.name}
                      onChange={(e) => setEditPerson({ ...editPerson, name: e.target.value })}
                    />
                    <Input
                      placeholder="Nazwisko"
                      value={editPerson.surname}
                      onChange={(e) => setEditPerson({ ...editPerson, surname: e.target.value })}
                    />
                    <Select
                      value={editPerson.relation}
                      onValueChange={(value) => setEditPerson({ ...editPerson, relation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Relacja" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationOptions.map((rel) => (
                          <SelectItem key={rel} value={rel}>
                            {rel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Telefon"
                      value={editPerson.phone}
                      onChange={(e) => setEditPerson({ ...editPerson, phone: e.target.value })}
                    />
                    <Input
                      placeholder="Nr dowodu osobistego"
                      value={editPerson.idNumber}
                      onChange={(e) => setEditPerson({ ...editPerson, idNumber: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingId(null)}>
                      Anuluj
                    </Button>
                    <Button
                      onClick={() => handleSaveEdit(person.id)}
                      disabled={saving}
                      className="bg-sky-600 hover:bg-sky-700"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      Zapisz
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                      <User className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                        {person.name} {person.surname}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        <span className="bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded text-xs">
                          {person.relation}
                        </span>
                        {person.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {person.phone}
                          </span>
                        )}
                        {person.idNumber && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {person.idNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStartEdit(person)}
                      aria-label={`Edytuj ${person.name} ${person.surname}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(person.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label={`Usuń ${person.name} ${person.surname}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        onClick={fetchAuthorizedPersons}
        className="w-fit"
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        Odśwież
      </Button>
    </div>
  );
}

