"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import MessagesInbox from "@/app/components/headteacher/Messages/MessagesInbox";

export default function Messages() {
    return (    
        <HeadTeacherLayout
            title="Wiadomości"
            description="Komunikacja z rodzicami i pracownikami"
        >
            <MessagesInbox />
        </HeadTeacherLayout>
    )
}