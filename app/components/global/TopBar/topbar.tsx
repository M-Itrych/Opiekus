'use client';

import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import CollectionsOutlined from "@mui/icons-material/CollectionsOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import Groups2Outlined from "@mui/icons-material/Groups2Outlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import Link from "next/link";
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import { usePathname } from "next/navigation";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import TaskOutlined from "@mui/icons-material/TaskOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import ReceiptOutlined from "@mui/icons-material/ReceiptOutlined";

export default function Topbar() {
    const pathname = usePathname().toLowerCase();

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
            label: "Dokumenty",
            href: "/HeadTeacher/Documents",
            Icon: DescriptionOutlined,
        },
        
    ];

    return (
        <header className="fixed left-[80px] top-0 right-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
            <nav className="flex w-full items-center gap-4 overflow-x-auto px-6 py-4 text-sm scrollbar-hide md:gap-6">
                {topbarItems.map(({ href, Icon, label }) => {
                    const normalizedHref = href.toLowerCase();
                    const isActive = pathname === normalizedHref;

                    return (
                        <Link
                            href={href}
                            key={label}
                            className={`group relative flex items-center gap-2 whitespace-nowrap px-2 py-1 transition-colors duration-200 hover:text-primary ${
                                isActive ? "text-sky-700" : ""
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