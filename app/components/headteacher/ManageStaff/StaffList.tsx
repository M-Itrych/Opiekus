"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Edit, Shield, User, Mail, Phone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  surname: string;
  role: "nauczyciel" | "intendentka" | "sekretarka" | "pomocnik";
  email: string;
  phone: string;
  permissions: string[];
  group?: string;
}

const mockStaff: StaffMember[] = [
  {
    id: "1",
    name: "Anna",
    surname: "Kowalska",
    role: "nauczyciel",
    email: "anna.kowalska@przedszkole.pl",
    phone: "+48 123 456 789",
    permissions: ["grupa", "aktywności", "komunikacja"],
    group: "Grupa Starszaków",
  },
  {
    id: "2",
    name: "Maria",
    surname: "Nowak",
    role: "nauczyciel",
    email: "maria.nowak@przedszkole.pl",
    phone: "+48 123 456 790",
    permissions: ["grupa", "aktywności"],
    group: "Grupa Średniaków",
  },
  {
    id: "3",
    name: "Katarzyna",
    surname: "Wiśniewska",
    role: "intendentka",
    email: "k.wisniewska@przedszkole.pl",
    phone: "+48 123 456 791",
    permissions: ["dokumentacja", "płatności", "żywienie"],
  },
  {
    id: "4",
    name: "Jan",
    surname: "Kowalczyk",
    role: "sekretarka",
    email: "j.kowalczyk@przedszkole.pl",
    phone: "+48 123 456 792",
    permissions: ["dokumentacja", "kontakt"],
  },
];

export default function StaffList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const filteredStaff = mockStaff.filter((member) => {
    const matchesSearch =
      `${member.name} ${member.surname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      nauczyciel: "Nauczyciel",
      intendentka: "Intendentka",
      sekretarka: "Sekretarka",
      pomocnik: "Pomocnik",
    };
    return labels[role] || role;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Zarządzanie personelem
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Dodawanie/usuwanie nauczycieli, przydzielanie uprawnień, generowanie upoważnień do przetwarzania danych
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Dodaj pracownika
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Szukaj pracowników..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Rola: {selectedRole === "all" ? "Wszystkie" : getRoleLabel(selectedRole)}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setSelectedRole("all")}>
              Wszystkie
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedRole("nauczyciel")}>
              Nauczyciel
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedRole("intendentka")}>
              Intendentka
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSelectedRole("sekretarka")}>
              Sekretarka
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredStaff.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
                <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {member.name} {member.surname}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                    {getRoleLabel(member.role)}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {member.phone}
                  </span>
                  {member.group && (
                    <>
                      <span>•</span>
                      <span>{member.group}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Shield className="h-3 w-3 text-zinc-400" />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Uprawnienia: {member.permissions.join(", ")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edytuj
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

