"use client";

import NavbarTemplate from "../navbar_template";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MessageIcon from '@mui/icons-material/Message';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';

export default function NavbarHeadteacher() {
    return (
        <NavbarTemplate items={[
            {
                icon: <MenuBookIcon />,
                text: "Dziennik",
                href: "/",
            },
            {
                icon: <MessageIcon />,
                text: "Wiadomosci",
                href: "/wiadomosci",
            },
            {
                icon: <ReceiptIcon />,
                text: "Rozliczenia",
                href: "/rozliczenia",
            },
            {
                icon: <SettingsIcon />,
                text: "Ustawienia",
                href: "/ustawienia",
            },
        ]} />
    )
}