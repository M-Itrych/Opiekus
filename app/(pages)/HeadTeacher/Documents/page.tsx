"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import DocumentsList from "@/app/components/headteacher/Documents/DocumentsList";

export default function Documents() {
	return (
		<HeadTeacherLayout
			title="Dokumenty"
			description="Zarządzanie i przeglądanie dokumentów przedszkolnych"
		>
			<DocumentsList />
		</HeadTeacherLayout>
	)
}