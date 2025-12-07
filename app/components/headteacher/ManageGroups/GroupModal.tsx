"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, UserMinus, Loader2, X } from "lucide-react";

interface GroupModalProps {
  groupId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Child {
  id: string;
  name: string;
  surname: string;
}

interface Staff {
  id: string;
  user: {
    name: string;
    surname: string;
  };
}

interface GroupDetails {
  id: string;
  name: string;
  ageRange: string;
  maxCapacity: number;
  children: Child[];
  staff: Staff[];
  roomId: string | null;
}

export function GroupModal({ groupId, isOpen, onClose, onSuccess }: GroupModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("25");
  const [roomId, setRoomId] = useState<string | null>(null);


  const [groupChildren, setGroupChildren] = useState<Child[]>([]);
  const [groupStaff, setGroupStaff] = useState<Staff[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Staff[]>([]);
  const [unassignedChildren, setUnassignedChildren] = useState<Child[]>([]);
  const [allGroups, setAllGroups] = useState<{id: string, name: string}[]>([]);
  const [rooms, setRooms] = useState<{id: string, name: string}[]>([]);

  const [selectedChildToAdd, setSelectedChildToAdd] = useState<string>("");
  const [selectedTeacherToAdd, setSelectedTeacherToAdd] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchAuxiliaryData();
      if (groupId) {
        fetchGroupDetails(groupId);
      }
    }
  }, [isOpen, groupId]);

  const resetForm = () => {
    setName("");
    setAgeRange("");
    setMaxCapacity("25");
    setRoomId(null);
    setGroupChildren([]);
    setGroupStaff([]);
    setActiveTab("details");
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [teachersRes, childrenRes, groupsRes, roomsRes] = await Promise.all([
        fetch("/api/staff/teachers"),
        fetch("/api/children/unassigned"),
        fetch("/api/groups"),
        fetch("/api/rooms")
      ]);
      
      if (teachersRes.ok) setAvailableTeachers(await teachersRes.json());
      if (childrenRes.ok) setUnassignedChildren(await childrenRes.json());
      if (groupsRes.ok) setAllGroups(await groupsRes.json());
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData.map((room: {id: string, name: string}) => ({ id: room.id, name: room.name })));
      }

    } catch (error) {
      console.error("Error fetching auxiliary data:", error);
    }
  };

  const fetchGroupDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${id}`);
      if (!response.ok) throw new Error("Failed to fetch group");
      
      const data: GroupDetails = await response.json();
      setName(data.name);
      setAgeRange(data.ageRange);
      setMaxCapacity(data.maxCapacity.toString());
      setRoomId(data.roomId);
      setGroupChildren(data.children);
      setGroupStaff(data.staff);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name,
        ageRange,
        maxCapacity: parseInt(maxCapacity),
        roomId
      };

      const url = groupId ? `/api/groups/${groupId}` : "/api/groups";
      const method = groupId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");

      if (!groupId) {
    
        onSuccess();
        onClose();
      } else {
        fetchGroupDetails(groupId);
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      alert("Błąd zapisu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddChild = async () => {
    if (!selectedChildToAdd || !groupId) return;
    try {
      const response = await fetch(`/api/children/${selectedChildToAdd}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (response.ok) {
        fetchGroupDetails(groupId);
        fetchAuxiliaryData();
        setSelectedChildToAdd("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveChild = async (childId: string) => {
    if (!confirm("Czy na pewno usunąć dziecko z grupy?") || !groupId) return;
    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: "null" }),
      });

      if (response.ok) {
        fetchGroupDetails(groupId);
        fetchAuxiliaryData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMoveChild = async (childId: string, targetGroupId: string) => {
    if (!groupId) return;
    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: targetGroupId }),
      });

      if (response.ok) {
        fetchGroupDetails(groupId);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const handleAddTeacher = async () => {
    if (!selectedTeacherToAdd || !groupId) return;
    try {
      const response = await fetch(`/api/staff/${selectedTeacherToAdd}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (response.ok) {
        fetchGroupDetails(groupId);
        setSelectedTeacherToAdd("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveTeacher = async (staffId: string) => {
    if (!confirm("Czy na pewno usunąć nauczyciela z grupy?") || !groupId) return;
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: "null" }),
      });

      if (response.ok) {
        fetchGroupDetails(groupId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-6 border-b dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {groupId ? "Edycja grupy" : "Nowa grupa"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Zarządzaj danymi grupy, dziećmi i kadrą.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === "details"
                      ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  Szczegóły
                </button>
                <button
                  onClick={() => setActiveTab("children")}
                  disabled={!groupId}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === "children"
                      ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  Dzieci
                </button>
                <button
                  onClick={() => setActiveTab("staff")}
                  disabled={!groupId}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === "staff"
                      ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  Kadra
                </button>
              </div>

              {activeTab === "details" && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nazwa grupy</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="np. Biedronki"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ageRange">Przedział wiekowy</Label>
                    <Input
                      id="ageRange"
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                      placeholder="np. 3-4 lata"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Limit miejsc</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="room">Sala</Label>
                    <Select
                      value={roomId || "none"}
                      onValueChange={(value) => setRoomId(value === "none" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz salę" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Brak sali</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-4 flex justify-end border-t dark:border-zinc-800 mt-4">
                    <Button onClick={handleSaveDetails} disabled={isSaving} className="bg-sky-500 hover:bg-sky-600 text-white">
                      {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "children" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Select value={selectedChildToAdd} onValueChange={setSelectedChildToAdd}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Wybierz dziecko do dodania" />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedChildren.length === 0 ? (
                          <SelectItem value="none" disabled>Brak nieprzypisanych dzieci</SelectItem>
                        ) : (
                          unassignedChildren.map((child) => (
                            <SelectItem key={child.id} value={child.id}>
                              {child.surname} {child.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddChild} disabled={!selectedChildToAdd} className="bg-sky-500 hover:bg-sky-600 text-white">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="border dark:border-zinc-700 rounded-md">
                    <div className="bg-zinc-50 dark:bg-zinc-800 p-2 border-b dark:border-zinc-700">
                      <h4 className="text-sm font-medium">Lista dzieci ({groupChildren.length})</h4>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                      {groupChildren.map((child) => (
                        <div key={child.id} className="flex items-center justify-between p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-sm transition-colors">
                          <span className="font-medium">{child.surname} {child.name}</span>
                          <div className="flex items-center gap-2">
                             <Select onValueChange={(val) => handleMoveChild(child.id, val)}>
                              <SelectTrigger className="h-8 w-[140px] text-xs">
                                 <SelectValue placeholder="Przenieś do..." />
                              </SelectTrigger>
                              <SelectContent>
                                {allGroups.filter(g => g.id !== groupId).map(g => (
                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleRemoveChild(child.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {groupChildren.length === 0 && (
                        <p className="text-center text-zinc-500 py-8 text-sm">Brak przypisanych dzieci</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "staff" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Select value={selectedTeacherToAdd} onValueChange={setSelectedTeacherToAdd}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Wybierz nauczyciela" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTeachers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.user.surname} {staff.user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddTeacher} disabled={!selectedTeacherToAdd} className="bg-sky-500 hover:bg-sky-600 text-white">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="border dark:border-zinc-700 rounded-md">
                    <div className="bg-zinc-50 dark:bg-zinc-800 p-2 border-b dark:border-zinc-700">
                      <h4 className="text-sm font-medium">Przypisana kadra</h4>
                    </div>
                     <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                      {groupStaff.map((staff) => (
                        <div key={staff.id} className="flex items-center justify-between p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-sm transition-colors">
                          <span className="font-medium">{staff.user.surname} {staff.user.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleRemoveTeacher(staff.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {groupStaff.length === 0 && (
                        <p className="text-center text-zinc-500 py-8 text-sm">Brak przypisanej kadry</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
