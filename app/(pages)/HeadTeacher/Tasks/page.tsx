"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import TasksList from "@/app/components/headteacher/Tasks/TasksList";

export default function Tasks() {
    return (
        <HeadTeacherLayout
            title="Zadania"
            description="Przydzielanie i śledzenie zadań dla personelu"
        >
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <TasksList />
            </section>
        </HeadTeacherLayout>
    )
}