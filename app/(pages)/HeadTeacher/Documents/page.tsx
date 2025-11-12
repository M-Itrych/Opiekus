"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import RODOManagement from "@/app/components/headteacher/Documents/RODOManagement";
import DocumentArchive from "@/app/components/headteacher/Documents/DocumentArchive";

export default function Documents() {
    return (
        <HeadTeacherLayout
            title="Dokumenty"
            description="Zarządzanie dokumentacją RODO, zgodami i archiwum dokumentów"
        >
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <RODOManagement />
            </section>
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <DocumentArchive />
            </section>
        </HeadTeacherLayout>
    )
}