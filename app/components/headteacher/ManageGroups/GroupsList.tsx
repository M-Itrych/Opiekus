"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { GroupModal } from "./GroupModal";
import { useModal } from "@/app/components/global/Modal/ModalContext";

interface Group {
  id: string;
  name: string;
  ageRange: string;
  childrenCount: number;
  maxCapacity: number;
  teacherName: string;
  room: string;
}

export default function GroupsList() {
  const { showModal } = useModal();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/groups");
      if (!response.ok) {
        throw new Error("Nie udało się pobrać grup");
      }
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      console.error(err);
      setError("Wystąpił błąd podczas ładowania grup.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = () => {
    setSelectedGroupId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedGroupId(id);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchGroups();
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "text-sky-700";
    if (percentage >= 75) return "text-sky-600";
    return "text-sky-500";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę grupę?")) return;

    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        showModal('error', data.error || 'Błąd usuwania');
        return;
      }

      fetchGroups(); // Odśwież listę
    } catch (error) {
      console.error("Error deleting group:", error);
      showModal('error', 'Wystąpił błąd');
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <GroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        groupId={selectedGroupId}
        onSuccess={handleSuccess}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Grupy przedszkolne
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Zarządzanie grupami: żłobek (0-3 lata, 8-12 dzieci), przedszkole (3-6 lat, 15-25 dzieci)
          </p>
        </div>
        <Button className="flex items-center gap-1.5 sm:gap-2 bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm w-full sm:w-auto" onClick={handleCreate}>
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          Dodaj grupę
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 sm:left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder="Szukaj grup..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 sm:pl-10 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8 sm:py-10">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <div className="text-center text-xs sm:text-sm text-red-500 py-8 sm:py-10">{error}</div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center text-xs sm:text-sm text-zinc-500 py-8 sm:py-10">Brak grup spełniających kryteria.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="flex flex-col gap-3 sm:gap-4 rounded-lg sm:rounded-xl border border-zinc-200 bg-white p-3 sm:p-4 md:p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="rounded-lg bg-sky-100 p-1.5 sm:p-2 dark:bg-sky-900/30 shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {group.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                      {group.ageRange}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Dzieci:</span>
                  <span className={`font-semibold ${getCapacityColor(group.childrenCount, group.maxCapacity)}`}>
                    {group.childrenCount}/{group.maxCapacity}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Nauczyciel:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {group.teacherName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Sala:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {group.room}
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5 sm:gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" onClick={() => handleEdit(group.id)}>
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Edytuj
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sky-600 hover:text-sky-700 text-xs sm:text-sm"
                  onClick={() => handleDelete(group.id)}
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
