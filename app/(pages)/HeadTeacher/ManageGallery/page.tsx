"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import GalleryManagement from "@/app/components/headteacher/ManageGallery/GalleryManagement";

export default function ManageGallery() {
    return (
        <HeadTeacherLayout
            title="Zarządzanie galerią"
            description="Zarządzanie i przeglądanie galerii przedszkolnych"
        >
            <section className="flex flex-col gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 md:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <GalleryManagement />
            </section>
        </HeadTeacherLayout>
    )
}