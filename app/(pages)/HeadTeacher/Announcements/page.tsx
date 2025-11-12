import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";

export default function Announcements() {
    return (
        <HeadTeacherLayout
            title="Ogłoszenia"
            description="Zarządzanie i przeglądanie ogłoszeń przedszkolnych"
        >
            <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Dostępne ogłoszenia
                    </h2>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-zinc-500">
                            Tutaj będą wyświetlane ogłoszenia
                        </p>
                    </div>
                </div>
            </section>
        </HeadTeacherLayout>
    )
}