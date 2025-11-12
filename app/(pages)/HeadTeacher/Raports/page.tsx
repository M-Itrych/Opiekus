"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import ReportsList from "@/app/components/headteacher/Raports/ReportsList";

export default function Raports() {
    return (
        <HeadTeacherLayout
            title="Raporty i statystyki"
            description="Generowanie raportów dla kontroli RODO, kuratorium i innych instytucji"
        >
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <ReportsList />
            </section>
        </HeadTeacherLayout>
    )
}