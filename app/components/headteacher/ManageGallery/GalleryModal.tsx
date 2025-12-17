"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, Trash2, Image as ImageIcon, Edit2, ZoomIn, Upload } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import { useModal } from "@/app/components/global/Modal/ModalContext";


interface GalleryModalProps {
  galleryId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
}

interface GalleryDetails {
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

interface GroupOption {
  id: string;
  name: string;
}

export function GalleryModal({ galleryId, isOpen, onClose, onSuccess }: GalleryModalProps) {
  const { showModal } = useModal();
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT" | "RESTRICTED">("DRAFT");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [childrenWithConsent, setChildrenWithConsent] = useState("0");
  const [childrenWithoutConsent, setChildrenWithoutConsent] = useState("0");

  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [allGroups, setAllGroups] = useState<GroupOption[]>([]);
  const [newPhotos, setNewPhotos] = useState<{ url: string; caption: string }[]>([]);
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<{ id: string; caption: string } | null>(null);
  const [editingNewPhotoCaption, setEditingNewPhotoCaption] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const galleryIdRef = useRef(galleryId);
  const pendingCaptionRef = useRef("");

  useEffect(() => {
    galleryIdRef.current = galleryId;
  }, [galleryId]);

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: async (res) => {
      if (res && res.length > 0) {
        const file = res[0];
        const uploadedUrl = file.url || file.ufsUrl || `https://utfs.io/f/${file.key}`;

        try {
          const currentGalleryId = galleryIdRef.current;
          const caption = pendingCaptionRef.current;

          if (currentGalleryId) {
            const response = await fetch(`/api/gallery/${currentGalleryId}/photos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: uploadedUrl,
                caption: caption || null,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Failed to add photo");
            }

            await fetchGalleryDetails(currentGalleryId);
          } else {
            setNewPhotos((prev) => [...prev, { url: uploadedUrl, caption: caption }]);
          }

          pendingCaptionRef.current = "";
          setNewPhotoCaption("");
        } catch (err) {
          console.error("Error adding photo:", err);
          showModal('error', 'Błąd podczas dodawania zdjęcia');
        }
      }

      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      showModal('error', `Błąd przesyłania: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    onUploadBegin: () => {
      setIsUploading(true);
    },
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchAuxiliaryData();
      if (galleryId) {
        fetchGalleryDetails(galleryId);
      } else {
        setDate(new Date().toISOString().split("T")[0]);
      }
    }
  }, [isOpen, galleryId]);

  const resetForm = () => {
    setTitle("");
    setDate("");
    setStatus("DRAFT");
    setGroupId(null);
    setChildrenWithConsent("0");
    setChildrenWithoutConsent("0");
    setGalleryPhotos([]);
    setNewPhotos([]);
    setNewPhotoCaption("");
    setActiveTab("details");
    setSelectedImage(null);
    setEditingCaption(null);
    setEditingNewPhotoCaption(null);
  };

  const fetchAuxiliaryData = async () => {
    try {
      const groupsRes = await fetch("/api/groups");
      if (groupsRes.ok) {
        const groups = await groupsRes.json();
        setAllGroups(groups.map((g: { id: string; name: string }) => ({ id: g.id, name: g.name })));
      }
    } catch (error) {
      console.error("Error fetching auxiliary data:", error);
    }
  };

  const fetchGalleryDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/gallery/${id}`);
      if (!response.ok) throw new Error("Failed to fetch gallery");

      const data: GalleryDetails = await response.json();

      setTitle(data.title);
      setDate(new Date(data.date).toISOString().split("T")[0]);
      setStatus(data.status);
      setGroupId(data.groupId);
      setChildrenWithConsent(data.childrenWithConsent.toString());
      setChildrenWithoutConsent(data.childrenWithoutConsent.toString());
      setGalleryPhotos(data.photos || []);
    } catch (error) {
      console.error(error);
      showModal('error', 'Błąd podczas ładowania galerii');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      const payload = {
        title,
        status,
        groupId: groupId || null,
        childrenWithConsent: parseInt(childrenWithConsent) || 0,
        childrenWithoutConsent: parseInt(childrenWithoutConsent) || 0,
      };

      if (galleryId) {
        const response = await fetch(`/api/gallery/${galleryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to update");

        fetchGalleryDetails(galleryId);
        onSuccess();
      } else {
        if (newPhotos.length === 0) {
          showModal('warning', 'Dodaj przynajmniej jedno zdjęcie');
          setIsSaving(false);
          return;
        }

        const createPayload = {
          ...payload,
          date: date || new Date().toISOString(),
          photos: newPhotos,
        };

        const response = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create");
        }

        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Błąd zapisu';
      showModal('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    if (!confirm("Czy na pewno usunąć to zdjęcie?") || !galleryId) return;

    try {
      const response = await fetch(`/api/gallery/${galleryId}/photos/${photoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setGalleryPhotos(galleryPhotos.filter((p) => p.id !== photoId));
      } else {
        const error = await response.json();
        showModal('error', error.error || 'Błąd usuwania');
      }
    } catch (error) {
      console.error(error);
      showModal('error', 'Błąd podczas usuwania zdjęcia');
    }
  };

  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotos(newPhotos.filter((_, i) => i !== index));
  };

  const handleUpdatePhotoCaption = async (photoId: string, newCaption: string) => {
    if (!galleryId) return;

    try {
      const response = await fetch(`/api/gallery/${galleryId}/photos/${photoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: newCaption || null }),
      });

      if (response.ok) {
        await fetchGalleryDetails(galleryId);
        setEditingCaption(null);
      } else {
        const error = await response.json();
        showModal('error', error.error || 'Błąd aktualizacji opisu');
      }
    } catch (error) {
      console.error(error);
      showModal('error', 'Błąd podczas aktualizacji opisu');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    pendingCaptionRef.current = newPhotoCaption;

    try {
      await startUpload([file]);
    } catch (err) {
      console.error("Upload error:", err);
      setIsUploading(false);
    }

    e.target.value = "";
  };

  if (!isOpen) return null;

  return (
    <>
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <img
              src={selectedImage}
              alt="Powiększone zdjęcie"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b dark:border-zinc-800">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {galleryId ? "Edycja galerii" : "Nowa galeria"}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Zarządzaj danymi galerii i zdjęciami.
              </p>
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
            ) : (
              <div className="space-y-6">
                <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${activeTab === "details"
                        ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                      }`}
                  >
                    Szczegóły
                  </button>
                  <button
                    onClick={() => setActiveTab("photos")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${activeTab === "photos"
                        ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                      }`}
                  >
                    Zdjęcia ({galleryId ? galleryPhotos.length : newPhotos.length})
                  </button>
                </div>

                {activeTab === "details" && (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Tytuł galerii</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="np. Wycieczka do zoo"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={status}
                        onValueChange={(val: "PUBLISHED" | "DRAFT" | "RESTRICTED") => setStatus(val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Wersja robocza</SelectItem>
                          <SelectItem value="PUBLISHED">Publiczna</SelectItem>
                          <SelectItem value="RESTRICTED">Ukryta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="groupId">Grupa (opcjonalnie)</Label>
                      <Select
                        value={groupId || "none"}
                        onValueChange={(val) => setGroupId(val === "none" ? null : val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz grupę" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Brak przypisania</SelectItem>
                          {allGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="withConsent">Dzieci z zgodą</Label>
                        <Input
                          id="withConsent"
                          type="number"
                          value={childrenWithConsent}
                          onChange={(e) => setChildrenWithConsent(e.target.value)}
                          min="0"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="withoutConsent">Dzieci bez zgody</Label>
                        <Input
                          id="withoutConsent"
                          type="number"
                          value={childrenWithoutConsent}
                          onChange={(e) => setChildrenWithoutConsent(e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end border-t dark:border-zinc-800 mt-4">
                      <Button onClick={handleSaveDetails} disabled={isSaving} className="bg-sky-500 hover:bg-sky-600 text-white">
                        {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === "photos" && (
                  <div className="space-y-4">
                    <div className="space-y-3 p-4 border dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <Label>Prześlij zdjęcie</Label>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          id="photo-upload"
                          className="hidden"
                          disabled={isUploading}
                          onChange={handleFileSelect}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={isUploading}
                          onClick={() => document.getElementById("photo-upload")?.click()}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Przesyłanie... {uploadProgress}%
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Wybierz zdjęcie
                            </>
                          )}
                        </Button>
                      </div>
                      <Input
                        placeholder="Opis zdjęcia (opcjonalnie)"
                        value={newPhotoCaption}
                        onChange={(e) => setNewPhotoCaption(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Możesz przesłać pliki JPG, PNG, GIF (maksymalnie 4MB)
                      </p>
                    </div>

                    <div className="border dark:border-zinc-700 rounded-md">
                      <div className="bg-zinc-50 dark:bg-zinc-800 p-3 border-b dark:border-zinc-700">
                        <h4 className="text-sm font-medium">
                          Lista zdjęć ({galleryId ? galleryPhotos.length : newPhotos.length})
                        </h4>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-4">
                        {galleryId && galleryPhotos.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {galleryPhotos.map((photo) => (
                              <div
                                key={photo.id}
                                className="group relative border dark:border-zinc-700 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-800 hover:shadow-md transition-shadow"
                              >
                                <div className="relative aspect-video bg-zinc-200 dark:bg-zinc-900">
                                  <img
                                    src={photo.url}
                                    alt={photo.caption || "Zdjęcie"}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setSelectedImage(photo.url)}
                                  />
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700"
                                      onClick={() => setSelectedImage(photo.url)}
                                      title="Powiększ"
                                    >
                                      <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700 text-red-500 hover:text-red-600"
                                      onClick={() => handleRemovePhoto(photo.id)}
                                      title="Usuń"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="p-3">
                                  {editingCaption?.id === photo.id ? (
                                    <Input
                                      value={editingCaption.caption}
                                      onChange={(e) =>
                                        setEditingCaption({ id: photo.id, caption: e.target.value })
                                      }
                                      onBlur={() =>
                                        handleUpdatePhotoCaption(photo.id, editingCaption.caption)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          handleUpdatePhotoCaption(photo.id, editingCaption.caption);
                                        if (e.key === "Escape") setEditingCaption(null);
                                      }}
                                      autoFocus
                                      className="text-sm"
                                    />
                                  ) : (
                                    <div className="flex items-start justify-between gap-2">
                                      <p
                                        className="text-sm font-medium flex-1 cursor-pointer hover:text-primary"
                                        onClick={() =>
                                          setEditingCaption({
                                            id: photo.id,
                                            caption: photo.caption || "",
                                          })
                                        }
                                        title="Kliknij, aby edytować opis"
                                      >
                                        {photo.caption || "Bez opisu"}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        onClick={() =>
                                          setEditingCaption({
                                            id: photo.id,
                                            caption: photo.caption || "",
                                          })
                                        }
                                        title="Edytuj opis"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!galleryId && newPhotos.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {newPhotos.map((photo, index) => (
                              <div
                                key={index}
                                className="group relative border dark:border-zinc-700 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-800 hover:shadow-md transition-shadow"
                              >
                                <div className="relative aspect-video bg-zinc-200 dark:bg-zinc-900">
                                  <img
                                    src={photo.url}
                                    alt={photo.caption || "Zdjęcie"}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setSelectedImage(photo.url)}
                                  />
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700"
                                      onClick={() => setSelectedImage(photo.url)}
                                      title="Powiększ"
                                    >
                                      <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700 text-red-500 hover:text-red-600"
                                      onClick={() => handleRemoveNewPhoto(index)}
                                      title="Usuń"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="p-3">
                                  {editingNewPhotoCaption === index ? (
                                    <Input
                                      value={photo.caption}
                                      onChange={(e) => {
                                        const updated = [...newPhotos];
                                        updated[index] = { ...updated[index], caption: e.target.value };
                                        setNewPhotos(updated);
                                      }}
                                      onBlur={() => setEditingNewPhotoCaption(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === "Escape")
                                          setEditingNewPhotoCaption(null);
                                      }}
                                      autoFocus
                                      className="text-sm"
                                    />
                                  ) : (
                                    <div className="flex items-start justify-between gap-2">
                                      <p
                                        className="text-sm font-medium flex-1 cursor-pointer hover:text-primary"
                                        onClick={() => setEditingNewPhotoCaption(index)}
                                        title="Kliknij, aby edytować opis"
                                      >
                                        {photo.caption || "Bez opisu"}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        onClick={() => setEditingNewPhotoCaption(index)}
                                        title="Edytuj opis"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {(galleryId ? galleryPhotos.length === 0 : newPhotos.length === 0) && (
                          <div className="text-center py-12">
                            <ImageIcon className="h-12 w-12 text-zinc-400 mx-auto mb-2" />
                            <p className="text-sm text-zinc-500">Brak zdjęć</p>
                            <p className="text-xs text-zinc-400 mt-1">
                              Dodaj zdjęcia używając przycisku powyżej
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
