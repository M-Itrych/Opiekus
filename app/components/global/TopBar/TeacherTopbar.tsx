'use client';

import HomeOutlined from "@mui/icons-material/HomeOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import MessageOutlined from "@mui/icons-material/MessageOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TeacherTopbar() {
    const pathname = usePathname().toLowerCase();

    const topbarItems = [
        {
            label: "Panel główny",
            href: "/Teacher",
            Icon: HomeOutlined,
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
            label: "Szkolenia",
            href: "/Teacher/Training",
            Icon: SchoolOutlined,
        },
    ];

    return (
        <header className="fixed left-[80px] top-0 right-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
            <nav className="flex w-full items-center gap-4 overflow-x-auto px-6 py-4 text-sm scrollbar-hide md:gap-6">
                {topbarItems.map(({ href, Icon, label }) => {
                    const normalizedHref = href.toLowerCase();
                    const isActive = pathname === normalizedHref || pathname.startsWith(normalizedHref + "/");

                    return (
                        <Link
                            href={href}
                            key={label}
                            className={`group relative flex items-center gap-2 whitespace-nowrap px-2 py-1 transition-colors duration-200 hover:text-primary ${
                                isActive ? "text-sky-700" : "text-zinc-600"
                            }`}
                        >
                            <Icon fontSize="small" />
                            <span>{label}</span>
                            <span
                                aria-hidden
                                className={`absolute inset-x-0 bottom-0 h-0.5 origin-center rounded-full transition-all duration-200 ${
                                    isActive
                                        ? "scale-100 bg-sky-500"
                                        : "scale-0 bg-sky-300 group-hover:scale-100"
                                }`}
                            />
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
}

