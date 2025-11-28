import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";
import AnnouncementsBoard from "@/app/components/headteacher/Announcements/AnnouncementsBoard";

export default function Announcements() {
    return (
        <HeadTeacherLayout
            title="Ogłoszenia"
            description="Zarządzanie i przeglądanie ogłoszeń przedszkolnych"
        >
            <AnnouncementsBoard />
        </HeadTeacherLayout>
    )
}