"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import GalleryManagement from "@/app/components/headteacher/ManageGallery/GalleryManagement";

export default function ManageGallery() {
    return (
        <HeadTeacherLayout
            title="Zarządzanie galerią"
            description="Galeria z automatycznym filtrowaniem zdjęć zgodnie z zgodami na wizerunek"
        >
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <GalleryManagement />
            </section>
        </HeadTeacherLayout>
    )
}