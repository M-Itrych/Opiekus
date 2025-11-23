'use client';

import HomeOutlined from "@mui/icons-material/HomeOutlined";
import ChildCareOutlined from "@mui/icons-material/ChildCareOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import ChecklistOutlined from "@mui/icons-material/ChecklistOutlined";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import MessageOutlined from "@mui/icons-material/MessageOutlined";
import PaymentOutlined from "@mui/icons-material/PaymentOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ParentTopbar() {
    const pathname = usePathname().toLowerCase();

    const topbarItems = [
        {
            label: "Panel",
            href: "/Parent",
            Icon: HomeOutlined,
        },
        {
            label: "Moje dziecko",
            href: "/Parent/dziecko",
            Icon: ChildCareOutlined,
        },
        {
            label: "Obecności",
            href: "/Parent/obecnosci",
            Icon: CalendarMonthOutlined,
        },
        {
            label: "Jadłospisy",
            href: "/Parent/jadlospis",
            Icon: ChecklistOutlined,
        },
        {
            label: "Galeria",
            href: "/Parent/galeria",
            Icon: ImageOutlined,
        },
        {
            label: "Ogłoszenia",
            href: "/Parent/ogloszenia",
            Icon: NotificationsOutlined,
        },
        {
            label: "Wiadomości",
            href: "/Parent/wiadomosci",
            Icon: MessageOutlined,
        },
        {
            label: "Płatności",
            href: "/Parent/platnosci",
            Icon: PaymentOutlined,
        },
        {
            label: "Ustawienia",
            href: "/Parent/ustawienia",
            Icon: SettingsOutlined,
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

