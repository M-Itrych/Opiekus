'use client';

import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import CollectionsOutlined from "@mui/icons-material/CollectionsOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import Groups2Outlined from "@mui/icons-material/Groups2Outlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import { usePathname, useRouter } from "next/navigation";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import TaskOutlined from "@mui/icons-material/TaskOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import ReceiptOutlined from "@mui/icons-material/ReceiptOutlined";
import PaymentOutlined from "@mui/icons-material/PaymentOutlined";
import LogoutIcon from "@mui/icons-material/Logout";

export default function Topbar() {
    const pathname = usePathname().toLowerCase();
    const router = useRouter();

    const signOut = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("Error logging out:", error);
        } finally {
            router.push("/Login");
        }
    };

    const topbarItems = [
        {
            label: "Panel głowny",
            href: "/HeadTeacher",
            Icon: HomeOutlined,
        },
        {
            label: "Kalendarz",
            href: "/HeadTeacher/Calendar",
            Icon: CalendarMonthOutlined,
        },
        {
            label: "Raporty i statystyki",
            href: "/HeadTeacher/Raports",
            Icon: BarChartOutlined,
        },
        {
            label: "Zadania",
            href: "/HeadTeacher/Tasks",
            Icon: TaskOutlined,
        },
        {
            label: "Ogłoszenia",
            href: "/HeadTeacher/Announcements",
            Icon: CampaignOutlined,
        },
        {
            label: "Zarządzanie salami",
            href: "/HeadTeacher/ManageRooms",
            Icon: SchoolOutlined,
        },
        {
            label: "Zarządzanie grupami",
            href: "/HeadTeacher/ManageGroups",
            Icon: Groups2Outlined,
        },
        {
            label: "Zarządzanie galerią",
            href: "/HeadTeacher/ManageGallery",
            Icon: CollectionsOutlined,
        },
        {
            label: "Zarządzanie kadrami",
            href: "/HeadTeacher/ManageStaff",
            Icon: PersonOutlineOutlined,
        },
        {
            label: "Rekrutacja",
            href: "/HeadTeacher/Recruitment",
            Icon: PersonAddOutlined,
        },
        {
            label: "Jadłospis",
            href: "/HeadTeacher/Menu",
            Icon: RestaurantMenuOutlined,
        },
        {
            label: "Rozliczenia",
            href: "/HeadTeacher/Settlements",
            Icon: ReceiptOutlined,
        },
        {
            label: "Płatności",
            href: "/HeadTeacher/Payments",
            Icon: PaymentOutlined,
        },
        {
            label: "Dokumenty",
            href: "/HeadTeacher/Documents",
            Icon: DescriptionOutlined,
        },
    ];

    return (
        <header className="fixed left-0 sm:left-[80px] top-0 right-0 z-50 border-b border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
                <nav className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 overflow-x-auto px-1 sm:px-2 md:px-3 lg:px-4 flex-1 min-w-0 scrollbar-hide">
                    {topbarItems.map(({ href, Icon, label }) => {
                        const normalizedHref = href.toLowerCase();
                        const isActive = pathname === normalizedHref || pathname.startsWith(normalizedHref + "/");

                        return (
                            <button
                                key={label}
                                onClick={() => router.push(href)}
                                className={`group relative flex items-center gap-1 sm:gap-1.5 md:gap-2 whitespace-nowrap px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-2 sm:py-2.5 md:py-3 transition-colors duration-200 text-xs sm:text-sm shrink-0 ${isActive ? "text-sky-700 bg-sky-50" : "text-zinc-600 hover:text-sky-600 hover:bg-gray-50"
                                    }`}
                            >
                                <Icon fontSize="small" />
                                <span className="hidden md:inline font-medium">{label}</span>
                                {isActive && (
                                    <span
                                        aria-hidden
                                        className="absolute inset-x-0 bottom-0 h-0.5 bg-sky-500 rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>
                <button
                    onClick={signOut}
                    className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200 text-xs sm:text-sm whitespace-nowrap border-l border-zinc-200 shrink-0"
                    title="Wyloguj"
                >
                    <LogoutIcon fontSize="small" />
                    <span className="hidden sm:inline font-medium">Wyloguj</span>
                </button>
            </div>
        </header>
    );
}