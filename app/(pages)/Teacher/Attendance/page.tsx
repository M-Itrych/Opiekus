"use client";

import TeacherLayout from "@/app/components/global/Layout/TeacherLayout";
import AttendanceTracker from "@/app/components/teacher/Attendance/AttendanceTracker";

export default function Attendance() {
  return (
    <TeacherLayout
      title="Obecności"
      description="Zarządzanie listą obecności dzieci w grupie"
    >
      <AttendanceTracker />
    </TeacherLayout>
  );
}

