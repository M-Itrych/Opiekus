"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  UserPlus,
  Edit,
  Shield,
  User,
  Mail,
  Phone,
  Loader2,
  Trash2,
  ChevronDown,
  X,
} from "lucide-react";

type StaffRoleValue = "NAUCZYCIEL" | "INTENDENTKA" | "SEKRETARKA" | "POMOCNIK";

interface StaffMember {
  id: string;
  staffRole: StaffRoleValue;
  permissions: string[];
  group: { id: string; name: string | null } | null;
  user: {
    id: string;
    name: string | null;
    surname: string | null;
    email: string;
    phone: string | null;
  };
}

interface GroupOption {
  id: string;
  name: string;
}

interface StaffFormState {
  name: string;
  surname: string;
  email: string;
  phone: string;
  password: string;
  staffRole: StaffRoleValue;
  groupId: string;
  permissions: string[];
}

const STAFF_ROLE_LABELS: Record<StaffRoleValue, string> = {
  NAUCZYCIEL: "Nauczyciel",
  INTENDENTKA: "Intendentka",
  SEKRETARKA: "Sekretarka",
  POMOCNIK: "Pomocnik",
};

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "Wszystkie" },
  { value: "NAUCZYCIEL", label: "Nauczyciel" },
  { value: "INTENDENTKA", label: "Intendentka" },
  { value: "SEKRETARKA", label: "Sekretarka" },
  { value: "POMOCNIK", label: "Pomocnik" },
] as const;

const PERMISSION_OPTIONS = [
  { value: "grupa", label: "Zarządzanie grupą" },
  { value: "aktywności", label: "Zarządzanie aktywnościami" },
  { value: "komunikacja", label: "Komunikacja" },
  { value: "dokumentacja", label: "Dokumentacja" },
  { value: "płatności", label: "Płatności" },
  { value: "żywienie", label: "Żywienie" },
  { value: "kontakt", label: "Kontakt z rodzicami" },
] as const;

const defaultFormState: StaffFormState = {
  name: "",
  surname: "",
  email: "",
  phone: "",
  password: "",
  staffRole: "NAUCZYCIEL",
  groupId: "",
  permissions: [],
};

function StaffModal({
  mode,
  open,
  onClose,
  onSubmit,
  groups,
  initialData,
  submitting,
  error,
}: {
  mode: "create" | "edit";
  open: boolean;
  onClose: () => void;
  onSubmit: (state: StaffFormState, id?: string) => Promise<void>;
  groups: GroupOption[];
  initialData?: StaffMember | null;
  submitting: boolean;
  error: string | null;
}) {
  const [formState, setFormState] = useState<StaffFormState>(defaultFormState);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialData) {
      setFormState({
        name: initialData.user.name ?? "",
        surname: initialData.user.surname ?? "",
        email: initialData.user.email,
        phone: initialData.user.phone ?? "",
        password: "",
        staffRole: initialData.staffRole,
        groupId: initialData.group?.id ?? "",
        permissions: initialData.permissions,
      });
    } else {
      setFormState(defaultFormState);
    }
  }, [mode, initialData, open]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit(formState, initialData?.id);
  };

  const togglePermission = (permission: string) => {
    setFormState((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((item) => item !== permission)
        : [...prev.permissions, permission],
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-zinc-900">
              {mode === "create" ? "Dodaj pracownika" : "Edytuj pracownika"}
            </h3>
            <p className="text-sm text-zinc-500">
              {mode === "create"
                ? "Uzupełnij dane, aby dodać nowego członka personelu."
                : "Zaktualizuj szczegóły pracownika lub przypisz go do innej grupy."}
            </p>
          </div>
          <button
            aria-label="Zamknij"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-zinc-700">Imię</label>
              <Input
                name="name"
                value={formState.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Nazwisko</label>
              <Input
                name="surname"
                value={formState.surname}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-zinc-700">Email</label>
              <Input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Telefon</label>
              <Input
                name="phone"
                value={formState.phone}
                onChange={handleChange}
                placeholder="+48 ..."
              />
            </div>
          </div>

          {mode === "create" && (
            <div>
              <label className="text-sm font-medium text-zinc-700">Hasło startowe</label>
              <Input
                type="password"
                name="password"
                value={formState.password}
                onChange={handleChange}
                placeholder="Min. 6 znaków"
                required
              />
            </div>
          )}

          {mode === "edit" && (
            <div>
              <label className="text-sm font-medium text-zinc-700">
                Nowe hasło (opcjonalnie)
              </label>
              <Input
                type="password"
                name="password"
                value={formState.password}
                onChange={handleChange}
                placeholder="Pozostaw puste, aby nie zmieniać"
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-zinc-700">Rola</label>
              <Select
                value={formState.staffRole}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, staffRole: value as StaffRoleValue }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Grupa</label>
              <Select
                value={formState.groupId || "none"}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    groupId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Brak przypisania" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Brak przypisania</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">
              Uprawnienia
            </label>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {PERMISSION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
                >
                  <Checkbox
                    checked={formState.permissions.includes(option.value)}
                    onCheckedChange={() => togglePermission(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffList() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/staff", { cache: "no-store" });
      if (!response.ok) throw new Error("Błąd pobierania danych");
      const data: StaffMember[] = await response.json();
      setStaff(data);
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać listy pracowników.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch("/api/groups", { cache: "no-store" });
      if (!response.ok) throw new Error("Błąd pobierania grup");
      const data = await response.json();
      setGroups(
        data.map((group: { id: string; name: string }) => ({
          id: group.id,
          name: group.name,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
    fetchGroups();
  }, [fetchStaff, fetchGroups]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        `${member.user.name ?? ""} ${member.user.surname ?? ""}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || member.staffRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staff, searchQuery, roleFilter]);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedStaff(null);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setModalMode("edit");
    setSelectedStaff(member);
    setModalError(null);
    setModalOpen(true);
  };

  const handleSaveStaff = async (state: StaffFormState, staffId?: string) => {
    if (modalMode === "create") {
      if (!state.password.trim()) {
        setModalError("Hasło jest wymagane.");
        return;
      }
    }

    const payload: Record<string, unknown> = {
      name: state.name.trim(),
      surname: state.surname.trim(),
      email: state.email.trim(),
      phone: state.phone.trim(),
      staffRole: state.staffRole,
      permissions: state.permissions,
      groupId: state.groupId || null,
    };

    if (modalMode === "create") {
      payload.password = state.password.trim();
    } else if (state.password.trim()) {
      payload.password = state.password.trim();
    }

    setModalSubmitting(true);
    setModalError(null);

    try {
      const response = await fetch(
        modalMode === "create" ? "/api/staff" : `/api/staff/${staffId}`,
        {
          method: modalMode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Operacja nie powiodła się");
      }

      setModalOpen(false);
      await fetchStaff();
    } catch (err) {
      console.error(err);
      setModalError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteStaff = async (member: StaffMember) => {
    if (
      !confirm(
        `Czy na pewno chcesz usunąć ${member.user.name ?? ""} ${
          member.user.surname ?? ""
        } z kadry?`
      )
    )
      return;

    try {
      const response = await fetch(`/api/staff/${member.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Nie udało się usunąć pracownika");
      }
      await fetchStaff();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Zarządzanie personelem</h3>
          <p className="text-sm text-zinc-500">
            Dodawanie, usuwanie, przydzielanie uprawnień i grup.
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={openCreateModal}>
          <UserPlus className="h-4 w-4" />
          Dodaj pracownika
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
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
              Rola:{" "}
              {
                ROLE_FILTER_OPTIONS.find((option) => option.value === roleFilter)?.label ??
                "Wszystkie"
              }
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {ROLE_FILTER_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => setRoleFilter(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Ładowanie kadry...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-500">
          Brak pracowników spełniających kryteria wyszukiwania.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-sky-100 p-2">
                    <User className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-zinc-900">
                        {member.user.name} {member.user.surname}
                      </span>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {STAFF_ROLE_LABELS[member.staffRole]}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.user.email}
                      </span>
                      {member.user.phone && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.user.phone}
                          </span>
                        </>
                      )}
                      {member.group?.name && (
                        <>
                          <span>•</span>
                          <span>{member.group.name}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                      <Shield className="h-3 w-3" />
                      <span>
                        Uprawnienia:{" "}
                        {member.permissions.length
                          ? member.permissions.join(", ")
                          : "nie zdefiniowano"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => openEditModal(member)}
                  >
                    <Edit className="h-4 w-4" />
                    Edytuj
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleDeleteStaff(member)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Usuń
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <StaffModal
        mode={modalMode}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveStaff}
        groups={groups}
        initialData={selectedStaff ?? undefined}
        submitting={modalSubmitting}
        error={modalError}
      />
    </div>
  );
}

