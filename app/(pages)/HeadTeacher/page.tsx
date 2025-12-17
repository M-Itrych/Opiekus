"use client";

import { useEffect, useState, useCallback } from "react";
import AttendanceSummary from "@/app/components/headteacher/PanelGlowny/AttendanceSummary";
import AttendanceChart from "@/app/components/headteacher/PanelGlowny/AttendanceChart";
import DayPlan from "@/app/components/headteacher/PanelGlowny/DayPlan";
import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";

type AttendanceKey = "present" | "reported" | "absent";

interface AttendanceStatus {
  key: AttendanceKey;
  label: string;
  color: string;
  accent: string;
}

const attendanceStatuses: AttendanceStatus[] = [
  {
    key: "present",
    label: "Obecni",
    color: "bg-emerald-500/15 text-emerald-600",
    accent: "bg-emerald-500",
  },
  {
    key: "reported",
    label: "Zgłoszone nieobecności",
    color: "bg-amber-500/15 text-amber-600",
    accent: "bg-amber-500",
  },
  {
    key: "absent",
    label: "Nieobecni",
    color: "bg-rose-500/15 text-rose-600",
    accent: "bg-rose-500",
  },
];

interface Attendance {
  id: string;
  childId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "PENDING";
  reason: string | null;
  child: {
    id: string;
    name: string;
    surname: string;
    groupId: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  ageRange: string;
  childrenCount: number;
  maxCapacity: number;
  teacherName: string;
  room: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  isImportant: boolean;
  createdAt: string;
  author: {
    name: string;
    surname: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
}

interface UpcomingEvent {
  title: string;
  date: string;
  time: string;
  description: string;
}

interface GroupAttendanceData {
  name: string;
  counts: Record<AttendanceKey, number>;
}

interface DayData {
  date: Date;
  grupyData: GroupAttendanceData[];
}

export default function HeadTeacher() {
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [dniDanych, setDniDanych] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const formatTimeFromDate = (dateString: string | null): string => {
    if (!dateString) return "00:00";
    const date = new Date(dateString);
    return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  };

  const processAttendanceData = useCallback(
    (attendances: Attendance[], groups: Group[], targetDate: Date): GroupAttendanceData[] => {
      const dateStr = formatDateForAPI(targetDate);
      const dayAttendances = attendances.filter((a) => a.date.startsWith(dateStr));

      const groupMap = new Map<string, { name: string; counts: Record<AttendanceKey, number> }>();

      groups.forEach((group) => {
        groupMap.set(group.id, {
          name: group.name,
          counts: { present: 0, reported: 0, absent: 0 },
        });
      });

      dayAttendances.forEach((attendance) => {
        const groupId = attendance.child.groupId;
        if (groupId && groupMap.has(groupId)) {
          const groupData = groupMap.get(groupId)!;
          if (attendance.status === "PRESENT") {
            groupData.counts.present++;
          } else if (attendance.status === "PENDING") {
            groupData.counts.reported++;
          } else if (attendance.status === "ABSENT") {
            groupData.counts.absent++;
          }
        }
      });

      const total: Record<AttendanceKey, number> = { present: 0, reported: 0, absent: 0 };
      groupMap.forEach((data) => {
        total.present += data.counts.present;
        total.reported += data.counts.reported;
        total.absent += data.counts.absent;
      });

      return [
        { name: "Wszyscy uczniowie", counts: total },
        ...Array.from(groupMap.values()),
      ];
    },
    []
  );

  const processAnnouncements = useCallback((announcements: Announcement[]): UpcomingEvent[] => {
    const now = new Date();
    const today = formatDateForAPI(now);

    const upcomingAnnouncements = announcements
      .filter((a) => {
        if (!a.eventDate) return false;
        const eventDateStr = a.eventDate.split("T")[0];
        return eventDateStr >= today;
      })
      .sort((a, b) => {
        const dateA = new Date(a.eventDate || a.createdAt);
        const dateB = new Date(b.eventDate || b.createdAt);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);

    return upcomingAnnouncements.map((a) => ({
      title: a.title,
      date: a.eventDate ? a.eventDate.split("T")[0] : formatDateForAPI(new Date(a.createdAt)),
      time: formatTimeFromDate(a.startTime || a.eventDate),
      description: a.content.length > 100 ? a.content.substring(0, 100) + "..." : a.content,
    }));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 2);
        const [attendancesRes, groupsRes, announcementsRes] = await Promise.all([
          fetch(`/api/attendances?startDate=${formatDateForAPI(threeDaysAgo)}&endDate=${formatDateForAPI(today)}`),
          fetch("/api/groups"),
          fetch("/api/announcements"),
        ]);

        if (!attendancesRes.ok || !groupsRes.ok || !announcementsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const attendances: Attendance[] = await attendancesRes.json();
        const groups: Group[] = await groupsRes.json();
        const announcements: Announcement[] = await announcementsRes.json();

        const processedDays: DayData[] = [];
        for (let i = 0; i < 3; i++) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          processedDays.push({
            date,
            grupyData: processAttendanceData(attendances, groups, date),
          });
        }
        setDniDanych(processedDays);

        const events = processAnnouncements(announcements);
        setUpcomingEvents(events);
      } catch (error) {
        console.error("Error fetching data:", error);
        setDniDanych([]);
        setUpcomingEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [processAttendanceData, processAnnouncements]);

  if (loading) {
    return (
      <HeadTeacherLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </HeadTeacherLayout>
    );
  }

  return (
    <HeadTeacherLayout>
      <DayPlan upcomingEvents={upcomingEvents} />
      <AttendanceSummary
        dniDanych={dniDanych}
        attendanceStatuses={attendanceStatuses}
      />
      <AttendanceChart
        dniDanych={dniDanych}
        attendanceStatuses={attendanceStatuses}
      />
    </HeadTeacherLayout>
  );
}
