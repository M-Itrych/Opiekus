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
                text: "Panel",
                href: "/Parent",
            },
            {
                icon: <MessageIcon />,
                text: "Wiadomości",
                href: "/Parent/wiadomosci",
            },
            {
                icon: <PaymentIcon />,
                text: "Płatności",
                href: "/Parent/platnosci",
            },
            {
                icon: <SettingsIcon />,
                text: "Ustawienia",
                href: "/Parent/ustawienia",
            },
        ]} />
    )
}