"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2, AlertTriangle, Leaf, Wheat, Milk, Sparkles } from "lucide-react";

interface ChildEditModalProps {
  childId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ChildDetails {
  id: string;
  name: string;
  surname: string;
  age: number;
  diet: string;
  allergies: string[];
  specialNeeds: string | null;
  hasImageConsent: boolean;
  hasDataConsent: boolean;
  parent: {
    name: string;
    surname: string;
    email: string;
    phone: string | null;
  };
  group: {
    id: string;
    name: string;
  } | null;
}

const DIET_TYPES = [
  { value: "STANDARD", label: "Standardowa", icon: Sparkles, color: "bg-zinc-100 text-zinc-700" },
  { value: "VEGETARIAN", label: "Wegetariańska", icon: Leaf, color: "bg-green-100 text-green-700" },
  { value: "VEGAN", label: "Wegańska", icon: Leaf, color: "bg-emerald-100 text-emerald-700" },
  { value: "GLUTEN_FREE", label: "Bezglutenowa", icon: Wheat, color: "bg-amber-100 text-amber-700" },
  { value: "LACTOSE_FREE", label: "Bez laktozy", icon: Milk, color: "bg-blue-100 text-blue-700" },
  { value: "CUSTOM", label: "Inna", icon: Sparkles, color: "bg-purple-100 text-purple-700" },
];

const COMMON_ALLERGENS = [
  "Gluten",
  "Mleko",
  "Jaja",
  "Orzechy",
  "Soja",
  "Ryby",
  "Seler",
  "Gorczyca",
  "Sezam",
];

export function ChildEditModal({ childId, isOpen, onClose, onSuccess }: ChildEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [age, setAge] = useState("");
  const [diet, setDiet] = useState("STANDARD");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [childData, setChildData] = useState<ChildDetails | null>(null);

  useEffect(() => {
    if (isOpen && childId) {
      fetchChildDetails();
    }
  }, [isOpen, childId]);

  const fetchChildDetails = async () => {
    if (!childId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/children/${childId}`);
      if (!response.ok) throw new Error("Nie udało się pobrać danych dziecka");
      
      const data: ChildDetails = await response.json();
      setChildData(data);
      setName(data.name);
      setSurname(data.surname);
      setAge(data.age.toString());
      setDiet(data.diet || "STANDARD");
      setAllergies(data.allergies || []);
      setSpecialNeeds(data.specialNeeds || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAllergen = (allergen: string) => {
    setAllergies((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  const handleSave = async () => {
    if (!childId) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          surname: surname.trim(),
          age: parseInt(age),
          diet,
          allergies,
          specialNeeds: specialNeeds.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Nie udało się zapisać zmian");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Edytuj dane dziecka
            </h2>
            {childData && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {childData.name} {childData.surname} • Grupa: {childData.group?.name || "Brak"}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : error && !childData ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Imię</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="surname">Nazwisko</Label>
                  <Input
                    id="surname"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="age">Wiek</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  max="10"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Dieta</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DIET_TYPES.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDiet(value)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                        diet === value
                          ? `${color} border-current`
                          : "border-zinc-200 hover:border-zinc-300 text-zinc-600"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Alergeny</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGENS.map((allergen) => (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => toggleAllergen(allergen)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        allergies.includes(allergen)
                          ? "bg-red-100 text-red-700 border-red-300"
                          : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      {allergen}
                    </button>
                  ))}
                </div>
                {allergies.length > 0 && (
                  <p className="text-xs text-zinc-500">
                    Wybrane: {allergies.join(", ")}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="specialNeeds">Specjalne potrzeby</Label>
                <Textarea
                  id="specialNeeds"
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  placeholder="Dodatkowe informacje o dziecku..."
                  rows={3}
                />
              </div>

              {childData?.parent && (
                <div className="border-t dark:border-zinc-700 pt-4">
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Rodzic</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {childData.parent.name} {childData.parent.surname}
                  </p>
                  <p className="text-sm text-zinc-500">{childData.parent.email}</p>
                  {childData.parent.phone && (
                    <p className="text-sm text-zinc-500">{childData.parent.phone}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-6 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Anuluj
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-sky-600 hover:bg-sky-500 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Zapisywanie...
              </>
            ) : (
              "Zapisz zmiany"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

