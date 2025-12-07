"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import { MenuCalendar } from "@/app/components/headteacher/Menu/MenuCalendar";

export default function Menu() {
	return (
		<HeadTeacherLayout
			title="Jadłospis"
			description="Zarządzanie i przeglądanie jadłospisów przedszkolnych"
		>
			<section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
				<MenuCalendar />
			</section>
		</HeadTeacherLayout>
	)
}