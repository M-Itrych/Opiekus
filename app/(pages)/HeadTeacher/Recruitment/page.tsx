"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import RecruitmentProcess from "@/app/components/headteacher/Recruitment/RecruitmentProcess";

export default function Recruitment() {
    return (
        <HeadTeacherLayout
            title="Rekrutacja"
            description="Proces przyjęcia dziecka: weryfikacja email, rejestracja w systemie, wypełnienie formularzy online"
        >
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <RecruitmentProcess />
            </section>
        </HeadTeacherLayout>
    )
}