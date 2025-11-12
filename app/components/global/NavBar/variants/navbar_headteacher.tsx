"use client";

import NavbarTemplate from "../navbar_template";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MessageIcon from '@mui/icons-material/Message';
import SettingsIcon from '@mui/icons-material/Settings';

export default function NavbarHeadteacher() {
    return (
        <NavbarTemplate items={[
            {
                icon: <MenuBookIcon />,
                text: "Dziennik",
                href: "/HeadTeacher",
            },
            {
                icon: <MessageIcon />,
                text: "Wiadomości",
                href: "/HeadTeacher/Messages",
            },
            {
                icon: <SettingsIcon />,
                text: "Ustawienia",
                href: "/HeadTeacher/Settings",
            },
        ]} />
    )
}