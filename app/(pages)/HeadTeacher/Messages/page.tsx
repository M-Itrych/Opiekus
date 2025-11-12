"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";

export default function Messages() {
    return (    
        <HeadTeacherLayout
        >
            <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Wiadomości
                    </h2>
                </div>
            </section>
        </HeadTeacherLayout>
    )
}