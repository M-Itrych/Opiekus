import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { AttendanceStatus } from "@prisma/client";

type SessionUser = {
  id: string;
  role: "ADMIN" | "HEADTEACHER" | "TEACHER" | "PARENT";
};

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return payload as SessionUser;
}

function normalizeStatus(value: unknown): AttendanceStatus | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return Object.values(AttendanceStatus).includes(upper as AttendanceStatus)
    ? (upper as AttendanceStatus)
    : null;
}

async function verifyAccessToAttendance(user: SessionUser, attendance: { childId: string }) {
  if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
    return true;
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: attendance.childId, parentId: user.id },
    });
    return !!child;
  }

  if (user.role === "TEACHER") {
    const staff = await prisma.staff.findUnique({
      where: { userId: user.id },
      select: { groupId: true },
    });
    if (staff?.groupId) {
      const child = await prisma.child.findFirst({
        where: { id: attendance.childId, groupId: staff.groupId },
      });
      return !!child;
    }
  }

  return false;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { id } = await params;

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, surname: true, groupId: true },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json({ error: "Wpis obecności nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToAttendance(user, attendance);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego wpisu" }, { status: 403 });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania obecności" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body;

    const existing = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Wpis obecności nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToAttendance(user, existing);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego wpisu" }, { status: 403 });
    }

    const updateData: { status?: AttendanceStatus; reason?: string | null } = {};

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) {
      updateData.status = normalizedStatus;
    }

    if (reason !== undefined) {
      updateData.reason = reason?.trim() || null;
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: updateData,
      include: {
        child: {
          select: { id: true, name: true, surname: true, groupId: true },
        },
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji obecności" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Wpis obecności nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToAttendance(user, existing);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego wpisu" }, { status: 403 });
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania wpisu obecności" },
      { status: 500 }
    );
  }
}

