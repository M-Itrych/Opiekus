'use client';

import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CollectionsOutlined from "@mui/icons-material/CollectionsOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import DirectionsBusFilledOutlined from "@mui/icons-material/DirectionsBusFilledOutlined";
import Groups2Outlined from "@mui/icons-material/Groups2Outlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import Link from "next/link";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import PollOutlined from "@mui/icons-material/PollOutlined";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import { usePathname } from "next/navigation";

export default function Topbar() {
    const pathname = usePathname()?.toLowerCase() ?? "";

    const topbarItems = [
        {
            label: "Panel głowny",
            href: "/headteacher",
            Icon: HomeOutlined,
        },
        {
            label: "Panel kalendarzowy",
            href: "/calendar",
            Icon: CalendarMonthOutlined,
        },
        {
            label: "Panel dzieny",
            href: "/day",
            Icon: MenuBookOutlined,
        },
        {
            label: "Ogłoszenia",
            href: "/announcements",
            Icon: CampaignOutlined,
        },
        {
            label: "Zarzadzanie salami",
            href: "/manage-rooms",
            Icon: SchoolOutlined,
        },
        {
            label: "Zarzadzanie grupami",
            href: "/manage-groups",
            Icon: Groups2Outlined,
        },
        {
            label: "Zarzadzanie galeria",
            href: "/manage-gallery",
            Icon: CollectionsOutlined,
        },
        {
            label: "Jadłospis",
            href: "/menu",
            Icon: RestaurantMenuOutlined,
        },
        {
            label: "Dokumenty",
            href: "/documents",
            Icon: DescriptionOutlined,
        },
        {
            label: "Ankiety",
            href: "/surveys",
            Icon: PollOutlined,
        },
        {
            label: "Wycieczki",
            href: "/trips",
            Icon: DirectionsBusFilledOutlined,
        },
    ];

    return (
        <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/90 backdrop-blur  dark:border-zinc-800 dark:bg-zinc-900/80">
            <nav className="flex w-full items-center gap-4 overflow-x-auto px-6 py-4 text-sm md:gap-6">
                {topbarItems.map(({ href, Icon, label }) => {
                    const normalizedHref = href.toLowerCase();
                    const isActive = pathname === normalizedHref;

                    return (
                        <Link
                            href={href}
                            key={label}
                            className={`flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-2 py-1 transition-colors duration-200 hover:text-primary ${
                                isActive ? "border-sky-400 text-sky-700" : ""
                            }`}
                        >
                            <Icon fontSize="small" />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
}