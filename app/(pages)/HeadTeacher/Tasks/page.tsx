"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import TasksList from "@/app/components/headteacher/Tasks/TasksList";

export default function Tasks() {
    return (
        <HeadTeacherLayout
            title="Zadania"
            description="Zarządzanie i przeglądanie zadań przedszkolnych"
        >
            <TasksList />
        </HeadTeacherLayout>
    )
}