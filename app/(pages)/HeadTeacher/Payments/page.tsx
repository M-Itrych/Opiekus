"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import { PaymentsManagement } from "@/app/components/headteacher/Payments/PaymentsManagement";

export default function PaymentsPage() {
    return (
        <HeadTeacherLayout
            title="Płatności"
            description="Wystawiaj i zarządzaj płatnościami dla dzieci"
        >
            <PaymentsManagement />
        </HeadTeacherLayout>
    );
}
