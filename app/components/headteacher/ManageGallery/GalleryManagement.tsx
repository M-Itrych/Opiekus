"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
  AlertCircle,
  Edit,
  Trash2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GalleryModal } from "./GalleryModal";
import { useModal } from "@/app/components/global/Modal/ModalContext";

interface GalleryItem {
  id: string;
  title: string;
  date: string;
  photos: { id: string }[];
  childrenWithConsent: number;
  childrenWithoutConsent: number;
  status: string;
  groupId: string | null;
}

export default function GalleryManagement() {
  const { showModal } = useModal();
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/gallery");
      if (!response.ok) {
        throw new Error("Nie udało się pobrać galerii");
      }
      const data = await response.json();
      setGalleries(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedGalleryId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedGalleryId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę galerię?")) return;
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        showModal('error', error.error || 'Błąd usuwania');
        return;
      }

      fetchGalleries();
    } catch (error) {
      console.error("Error deleting gallery:", error);
      showModal('error', 'Wystąpił błąd');
    }
  };

  const handleSuccess = () => {
    fetchGalleries();
  };

  const filteredItems = galleries.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || item.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PUBLISHED: "Publiczna",
      DRAFT: "Wersja robocza",
      RESTRICTED: "Ukryta",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    switch (normalizedStatus) {
      case "PUBLISHED":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
      case "DRAFT":
        return "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400";
      case "RESTRICTED":
        return "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400";
      default:
        return "";
    }
  };

  return (
    <>
      <GalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        galleryId={selectedGalleryId}
        onSuccess={handleSuccess}
      />

      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Zarządzanie galeriami
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Galeria z automatycznym filtrowaniem zdjęć zgodnie z zgodami na wizerunek
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-fit justify-end">
            <Button
              className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto cursor-pointer bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-800/30 text-xs sm:text-sm"
              onClick={handleCreate}
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dodaj nową galerię</span>
              <span className="sm:hidden">Dodaj galerię</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 sm:left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Szukaj galerii..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 text-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm">
                <span className="hidden sm:inline">Status: </span>
                <span>{selectedStatus === "all" ? "Wszystkie" : getStatusLabel(selectedStatus)}</span>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setSelectedStatus("all")}>
                Wszystkie
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedStatus("PUBLISHED")}>
                Publiczna
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedStatus("DRAFT")}>
                Wersja robocza
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectedStatus("RESTRICTED")}>
                Ukryta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {loading ? (
          <div className="flex justify-center py-8 sm:py-10">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-zinc-400" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-xs sm:text-sm text-zinc-500 py-8 sm:py-10">
            Brak galerii spełniających kryteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 sm:gap-4 rounded-lg sm:rounded-xl border border-zinc-200 bg-white p-3 sm:p-4 md:p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="rounded-lg bg-sky-100 p-1.5 sm:p-2 dark:bg-sky-900/30 shrink-0">
                      <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                        {new Date(item.date).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Zdjęcia:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.photos?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sky-600">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      Z zgodą:
                    </span>
                    <span className="font-semibold text-sky-600">
                      {item.childrenWithConsent}
                    </span>
                  </div>
                  {item.childrenWithoutConsent > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sky-500">
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        Bez zgody:
                      </span>
                      <span className="font-semibold text-sky-500">
                        {item.childrenWithoutConsent}
                      </span>
                    </div>
                  )}
                </div>

                {item.childrenWithoutConsent > 0 && (
                  <div className="rounded-lg bg-sky-50 p-2 sm:p-3 dark:bg-sky-900/20">
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-sky-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-sky-700 dark:text-sky-400">
                        {item.childrenWithoutConsent} dzieci bez zgody na zdjęcia - zdjęcia będą automatycznie przefiltrowane
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 sm:gap-0 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                  <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer flex-1 sm:flex-none text-xs sm:text-sm"
                      onClick={() => handleEdit(item.id)}
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Edytuj
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 cursor-pointer text-xs sm:text-sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
