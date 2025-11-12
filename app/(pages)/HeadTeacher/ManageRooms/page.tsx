"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import RoomsList from "@/app/components/headteacher/ManageRooms/RoomsList";

export default function ManageRooms() {
    return (
        <HeadTeacherLayout
            title="Zarządzanie salami"
            description="Rezerwacja sal, harmonogram wykorzystania, konserwacja i wyposażenie"
        >
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <RoomsList />
            </section>
        </HeadTeacherLayout>
    )
}