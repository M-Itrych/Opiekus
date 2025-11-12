"use client";

import NavbarTemplate from "../navbar_template";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MessageIcon from '@mui/icons-material/Message';
import SettingsIcon from '@mui/icons-material/Settings';
import PaymentIcon from '@mui/icons-material/Payment';

export default function NavbarParent() {
    return (
        <NavbarTemplate items={[
            {
                icon: <MenuBookIcon />,
                text: "Dziennik",
                href: "/Parent",
            },
            {
                icon: <MessageIcon />,
                text: "Wiadomości",
                href: "/Parent/Messages",
            },
            {
                icon: <PaymentIcon />,
                text: "Płatności",
                href: "/Parent/Payments",
            },
            {
                icon: <SettingsIcon />,
                text: "Ustawienia",
                href: "/Parent/Settings",
            },
        ]} />
    )
}