"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import StaffList from "@/app/components/headteacher/ManageStaff/StaffList";

export default function ManageStaff() {
    return (
        <HeadTeacherLayout
            title="Zarządzanie kadrami"
            description="Dodawanie/usuwanie nauczycieli, przydzielanie uprawnień, generowanie upoważnień do przetwarzania danych"
        >
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <StaffList />
            </section>
        </HeadTeacherLayout>
    )
}