"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import StaffList from "@/app/components/headteacher/ManageStaff/StaffList";

export default function ManageStaff() {
    return (
        <HeadTeacherLayout
            title="Zarządzanie kadrami"
            description="Zarządzanie i przeglądanie kadr przedszkolnych"
        >
            <section className="flex flex-col gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 md:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <StaffList />
            </section>
        </HeadTeacherLayout>
    )
}