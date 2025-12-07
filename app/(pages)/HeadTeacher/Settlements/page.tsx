"use client";

import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import SettlementsList from "@/app/components/headteacher/Settlements/SettlementsList";

export default function Settlements() {
	return (
		<HeadTeacherLayout
			title="Rozliczenia posiłków"
			description="Zarządzanie zwrotami za anulowane posiłki"
		>
			<section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
				<SettlementsList />
			</section>
		</HeadTeacherLayout>
	);
}

