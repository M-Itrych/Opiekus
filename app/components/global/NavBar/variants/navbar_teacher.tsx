"use client";

import NavbarTemplate from "../navbar_template";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MessageIcon from '@mui/icons-material/Message';
import GroupIcon from '@mui/icons-material/Group';
import SchoolIcon from '@mui/icons-material/School';
import ChecklistIcon from '@mui/icons-material/Checklist';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';

export default function NavbarTeacher() {
	return (
		<NavbarTemplate 
			items={[
				{
					icon: <MenuBookIcon />,
					text: "Dziennik",
					href: "/Teacher",
				},
				{
					icon: <ChecklistIcon />,
					text: "Obecności",
					href: "/Teacher/Attendance",
				},
				{
					icon: <GroupIcon />,
					text: "Moja grupa",
					href: "/Teacher/Group",
				},
				{
					icon: <RestaurantMenuIcon />,
					text: "Jadłospis",
					href: "/Teacher/Menu",
				},
				{
					icon: <MessageIcon />,
					text: "Wiadomości",
					href: "/Teacher/Messages",
				},
				{
					icon: <SchoolIcon />,
					text: "Szkolenia",
					href: "/Teacher/Training",
				},
			]}
		/>
	)
}

