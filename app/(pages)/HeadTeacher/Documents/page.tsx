"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";

export default function Documents() {
    return (
        <HeadTeacherLayout
            title="Dokumenty"
            description="Zarządzanie i przeglądanie dokumentów przedszkolnych"
        >
            <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Dostępne dokumenty
                    </h2>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-zinc-500">
                            Tutaj będą wyświetlane dokumenty
                        </p>
                    </div>
                </div>
            </section>
        </HeadTeacherLayout>
    )
}