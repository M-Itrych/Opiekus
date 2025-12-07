import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma, AttendanceStatus } from "@prisma/client";

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

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const where: Prisma.AttendanceWhereInput = {};

    if (user.role === "PARENT") {
      const children = await prisma.child.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      where.childId = { in: childIds };
    }

    if (user.role === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
        select: { groupId: true },
      });
      if (staff?.groupId) {
        const children = await prisma.child.findMany({
          where: { groupId: staff.groupId },
          select: { id: true },
        });
        const childIds = children.map((c) => c.id);
        where.childId = { in: childIds };
      }
    }

    if (childId) {
      if (user.role === "PARENT") {
        const child = await prisma.child.findFirst({
          where: { id: childId, parentId: user.id },
        });
        if (!child) {
          return NextResponse.json({ error: "Brak dostępu do tego dziecka" }, { status: 403 });
        }
      }
      where.childId = childId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) {
      where.status = normalizedStatus;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        child: {
          select: { id: true, name: true, surname: true, groupId: true },
        },
      },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error("Error fetching attendances:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania obecności" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const body = await request.json();
    const { childId, date, status, reason } = body;

    if (!childId || !date) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    if (user.role === "PARENT") {
      const child = await prisma.child.findFirst({
        where: { id: childId, parentId: user.id },
      });
      if (!child) {
        return NextResponse.json({ error: "Brak dostępu do tego dziecka" }, { status: 403 });
      }
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      return NextResponse.json({ error: "Dziecko nie istnieje" }, { status: 400 });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Nieprawidłowa data" }, { status: 400 });
    }

    const normalizedStatus = normalizeStatus(status) ?? AttendanceStatus.PRESENT;

    const existing = await prisma.attendance.findFirst({
      where: {
        childId,
        date: {
          gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
          lt: new Date(parsedDate.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existing) {
      const attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: normalizedStatus,
          reason: reason?.trim() || null,
        },
        include: {
          child: {
            select: { id: true, name: true, surname: true, groupId: true },
          },
        },
      });
      return NextResponse.json(attendance);
    }

    const attendance = await prisma.attendance.create({
      data: {
        childId,
        date: new Date(date),
        status: normalizedStatus,
        reason: reason?.trim() || null,
      },
      include: {
        child: {
          select: { id: true, name: true, surname: true, groupId: true },
        },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia wpisu obecności" },
      { status: 500 }
    );
  }
}

