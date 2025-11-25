"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import GroupsList from "@/app/components/headteacher/ManageGroups/GroupsList";


export default function ManageGroups() {
    return (
        <HeadTeacherLayout
            title="Zarządzanie grupami"
            description="Zarządzanie i przeglądanie grup przedszkolnych"
        >
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <GroupsList />
            </section>
        </HeadTeacherLayout>
    )
}