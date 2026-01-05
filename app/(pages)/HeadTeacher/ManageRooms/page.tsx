"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import RoomsList from "@/app/components/headteacher/ManageRooms/RoomsList";

export default function ManageRooms() {
    return (
        <HeadTeacherLayout
            title="Zarządzanie salami"
            description="Zarządzanie i przeglądanie sal przedszkolnych"
        >
            <section className="flex flex-col gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 md:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <RoomsList />
            </section>
        </HeadTeacherLayout>
    )
}