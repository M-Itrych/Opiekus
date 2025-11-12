"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Image as ImageIcon, Upload, Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  date: string;
  photoCount: number;
  childrenWithConsent: number;
  childrenWithoutConsent: number;
  status: "published" | "draft" | "restricted";
}

const mockGalleryItems: GalleryItem[] = [
  {
    id: "1",
    title: "Wycieczka do zoo",
    date: "2024-01-20",
    photoCount: 45,
    childrenWithConsent: 18,
    childrenWithoutConsent: 2,
    status: "published",
  },
  {
    id: "2",
    title: "Zajęcia plastyczne",
    date: "2024-01-18",
    photoCount: 32,
    childrenWithConsent: 20,
    childrenWithoutConsent: 0,
    status: "published",
  },
  {
    id: "3",
    title: "Bal karnawałowy",
    date: "2024-01-15",
    photoCount: 67,
    childrenWithConsent: 15,
    childrenWithoutConsent: 5,
    status: "restricted",
  },
];

export default function GalleryManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredItems = mockGalleryItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      published: "Opublikowana",
      draft: "Szkic",
      restricted: "Ograniczona",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
      case "draft":
        return "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400";
      case "restricted":
        return "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Zarządzanie galerią
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Galeria z automatycznym filtrowaniem zdjęć zgodnie z zgodami na wizerunek
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Dodaj galerię
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Szukaj galerii..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Status: {selectedStatus === "all" ? "Wszystkie" : getStatusLabel(selectedStatus)}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setSelectedStatus("all")}>
              Wszystkie
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedStatus("published")}>
              Opublikowane
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedStatus("draft")}>
              Szkice
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedStatus("restricted")}>
              Ograniczone
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
                  <ImageIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {item.date}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Zdjęcia:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.photoCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sky-600">
                  <Eye className="h-4 w-4" />
                  Z zgodą:
                </span>
                <span className="font-semibold text-sky-600">
                  {item.childrenWithConsent}
                </span>
              </div>
              {item.childrenWithoutConsent > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sky-500">
                    <EyeOff className="h-4 w-4" />
                    Bez zgody:
                  </span>
                  <span className="font-semibold text-sky-500">
                    {item.childrenWithoutConsent}
                  </span>
                </div>
              )}
            </div>

            {item.childrenWithoutConsent > 0 && (
              <div className="rounded-lg bg-sky-50 p-3 dark:bg-sky-900/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-sky-600 mt-0.5" />
                  <p className="text-xs text-sky-700 dark:text-sky-400">
                    {item.childrenWithoutConsent} dzieci bez zgody na zdjęcia - zdjęcia będą automatycznie przefiltrowane
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {getStatusLabel(item.status)}
              </span>
              <Button variant="outline" size="sm">
                Zarządzaj
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

