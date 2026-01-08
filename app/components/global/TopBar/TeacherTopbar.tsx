'use client';

import HomeOutlined from "@mui/icons-material/HomeOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import MessageOutlined from "@mui/icons-material/MessageOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LogoutIcon from "@mui/icons-material/Logout";
import { usePathname, useRouter } from "next/navigation";

export default function TeacherTopbar() {
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
            label: "Panel główny",
            href: "/Teacher",
            Icon: HomeOutlined,
        },
        {
            label: "Obecności",
            href: "/Teacher/Attendance",
            Icon: ChecklistIcon,
        },
        {
            label: "Moja grupa",
            href: "/Teacher/Group",
            Icon: GroupOutlined,
        },
        {
            label: "Aktywności dzienne",
            href: "/Teacher/Activities",
            Icon: AccessTimeOutlined,
        },
        {
            label: "Kontrola odbioru",
            href: "/Teacher/Pickup",
            Icon: GroupOutlined,
        },
        {
            label: "Wiadomości",
            href: "/Teacher/Messages",
            Icon: MessageOutlined,
        },
        {
            label: "Jadłospis",
            href: "/Teacher/Menu",
            Icon: RestaurantMenuOutlined,
        },
        {
            label: "Ogłoszenia",
            href: "/Teacher/Announcements",
            Icon: CampaignOutlined,
        },
        {
            label: "Zadania",
            href: "/Teacher/Tasks",
            Icon: AssignmentIcon,
        },
        {
            label: "Szkolenia",
            href: "/Teacher/Training",
            Icon: SchoolOutlined,
        },
    ];

    return (
        <header className="fixed left-0 sm:left-[80px] top-0 right-0 z-50 border-b border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
                <nav className="flex items-center gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto px-1 sm:px-2 md:px-4 flex-1 min-w-0 scrollbar-hide">
                    {topbarItems.map(({ href, Icon, label }) => {
                        const normalizedHref = href.toLowerCase();
                        const isActive = pathname === normalizedHref || pathname.startsWith(normalizedHref + "/");

                        return (
                            <button
                                key={label}
                                onClick={() => router.push(href)}
                                className={`group relative flex items-center gap-1 sm:gap-1.5 md:gap-2 whitespace-nowrap px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 md:py-3 transition-colors duration-200 text-xs sm:text-sm shrink-0 ${
                                    isActive ? "text-sky-700 bg-sky-50" : "text-zinc-600 hover:text-sky-600 hover:bg-gray-50"
                                }`}
                            >
                                <Icon fontSize="small" />
                                <span className="hidden sm:inline font-medium">{label}</span>
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

