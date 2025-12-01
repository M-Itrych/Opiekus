"use client";

import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import EventIcon from "@mui/icons-material/Event";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Image from "next/image";
import { Loader2, Image as ImageIcon, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
}

interface Gallery {
  id: string;
  title: string;
  date: string;
  status: "PUBLISHED" | "DRAFT" | "RESTRICTED";
  groupId: string | null;
  childrenWithConsent: number;
  childrenWithoutConsent: number;
  photos: GalleryPhoto[];
  group?: {
    id: string;
    name: string;
  } | null;
}

const MONTH_LABELS = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

function getMonthKey(date: string): string {
  return format(new Date(date), "yyyy-MM");
}

export default function GaleriaPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<string | null>(null);

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gallery");
      if (!response.ok) {
        throw new Error("Nie udało się pobrać galerii");
      }
      const data: Gallery[] = await response.json();
      setGalleries(data);
    } catch (err) {
      console.error("Error fetching galleries:", err);
      setError("Błąd podczas ładowania galerii");
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueMonths = useMemo(() => {
    const months = galleries.map((gallery) => getMonthKey(gallery.date));
    return Array.from(new Set(months)).sort().reverse();
  }, [galleries]);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    uniqueMonths[0] ?? new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    if (uniqueMonths.length > 0 && !uniqueMonths.includes(selectedMonth)) {
      setSelectedMonth(uniqueMonths[0]);
    }
  }, [uniqueMonths, selectedMonth]);

  const monthIndex = uniqueMonths.indexOf(selectedMonth);

  const filteredGalleries = useMemo(() => {
    return galleries.filter((gallery) => getMonthKey(gallery.date) === selectedMonth);
  }, [galleries, selectedMonth]);

  const handleMonthChange = (direction: "prev" | "next") => {
    if (uniqueMonths.length === 0) return;
    const newIndex =
      direction === "prev"
        ? Math.max(0, monthIndex - 1)
        : Math.min(uniqueMonths.length - 1, monthIndex + 1);

    setSelectedMonth(uniqueMonths[newIndex]);
  };

  const openGallery = (galleryId: string) => {
    setSelectedGallery(galleryId);
  };

  const closeGallery = () => {
    setSelectedGallery(null);
    setSelectedImage(null);
  };

  const selectedGalleryData = selectedGallery
    ? galleries.find((g) => g.id === selectedGallery)
    : null;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-red-200 rounded-xl text-center">
          <p className="text-lg font-semibold text-red-700 mb-1">{error}</p>
          <Button onClick={fetchGalleries} className="mt-4">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <Image
              src={selectedImage}
              alt="Powiększone zdjęcie"
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setSelectedImage(null)}
            >
              <ImageIcon className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      {selectedGalleryData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeGallery}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b dark:border-zinc-800">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedGalleryData.title}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {format(new Date(selectedGalleryData.date), "d MMMM yyyy", { locale: pl })}
                  {selectedGalleryData.group && ` • ${selectedGalleryData.group.name}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeGallery}>
                <ImageIcon className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {selectedGalleryData.photos.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">Brak zdjęć w tej galerii</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedGalleryData.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative border dark:border-zinc-700 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-800 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedImage(photo.url)}
                    >
                      <div className="relative aspect-video bg-zinc-200 dark:bg-zinc-900">
                        <Image
                          src={photo.url}
                          alt={photo.caption || "Zdjęcie"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      {photo.caption && (
                        <div className="p-3">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                            {photo.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Galeria</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Zobacz zdjęcia z wydarzeń w przedszkolu i wybierz interesujący Cię miesiąc.
            </p>
          </div>
          {uniqueMonths.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleMonthChange("prev")}
                disabled={monthIndex === 0}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <NavigateBeforeIcon fontSize="small" />
                Poprzedni
              </button>
              <div className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2 text-sm">
                <EventIcon fontSize="small" />
                {formatMonth(selectedMonth)}
              </div>
              <button
                onClick={() => handleMonthChange("next")}
                disabled={monthIndex === uniqueMonths.length - 1}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Następny
                <NavigateNextIcon fontSize="small" />
              </button>
            </div>
          )}
        </div>

        {filteredGalleries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-dashed border-gray-200 dark:border-zinc-700 rounded-xl text-center">
            <ImageIcon className="h-16 w-16 text-gray-300 dark:text-zinc-600 mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Brak galerii dla wybranego miesiąca
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Wybierz inny miesiąc, aby zobaczyć więcej galerii.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGalleries.map((gallery) => {
              const firstPhoto = gallery.photos[0];
              const photoCount = gallery.photos.length;

              return (
                <div
                  key={gallery.id}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openGallery(gallery.id)}
                >
                  <div className="relative aspect-4/3 overflow-hidden">
                    {firstPhoto ? (
                      <Image
                        src={firstPhoto.url}
                        alt={gallery.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900 dark:to-sky-800 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-sky-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm" />
                    {photoCount > 0 && (
                      <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                        {photoCount} {photoCount === 1 ? "zdjęcie" : photoCount < 5 ? "zdjęcia" : "zdjęć"}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">
                      {gallery.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(new Date(gallery.date), "d MMMM yyyy", { locale: pl })}
                      {gallery.group && ` • ${gallery.group.name}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
