"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import RecruitmentProcess from "@/app/components/headteacher/Recruitment/RecruitmentProcess";

export default function Recruitment() {
    return (
        <HeadTeacherLayout
            title="Rekrutacja"
            description="Zarządzanie i przeglądanie rekrutacji przedszkolnych"
        >
            <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Dostępne rekrutacje
                    </h2>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-zinc-500">
                            Tutaj będą wyświetlane rekrutacje
                        </p>
                    </div>
                </div>
            </section>
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <RecruitmentProcess />
            </section>
        </HeadTeacherLayout>
    )
}