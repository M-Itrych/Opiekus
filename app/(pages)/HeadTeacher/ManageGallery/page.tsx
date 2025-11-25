"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import GalleryManagement from "@/app/components/headteacher/ManageGallery/GalleryManagement";

export default function ManageGallery() {
    return (
        <HeadTeacherLayout
            title="Zarządzanie galerią"
            description="Zarządzanie i przeglądanie galerii przedszkolnych"
        >
            <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Dostępne galerie
                    </h2>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-zinc-500">
                            Tutaj będą wyświetlane galerie
                        </p>
                    </div>
                </div>
            </section>
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <GalleryManagement />
            </section>
        </HeadTeacherLayout>
    )
}