import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma } from "@prisma/client";

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

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Prisma.PickupRecordWhereInput = {};

    // Parents can only see their children's pickup records
    if (user.role === "PARENT") {
      const children = await prisma.child.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      where.childId = { in: childIds };
    }

    // Teachers can see pickup records for their group
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

    // Filter by specific child
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

    // Filter by specific date
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.pickupDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.pickupDate = where.pickupDate || {};
      if (startDate) {
        (where.pickupDate as Prisma.DateTimeFilter).gte = new Date(startDate);
      }
      if (endDate) {
        (where.pickupDate as Prisma.DateTimeFilter).lte = new Date(endDate);
      }
    }

    const pickupRecords = await prisma.pickupRecord.findMany({
      where,
      orderBy: { pickupDate: "desc" },
      include: {
        child: {
          select: { id: true, name: true, surname: true, groupId: true },
        },
      },
    });

    return NextResponse.json(pickupRecords);
  } catch (error) {
    console.error("Error fetching pickup records:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania rekordów odbioru" },
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

    // Only teachers, headteachers, and admins can create pickup records
    if (!["TEACHER", "HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const body = await request.json();
    const { childId, pickupDate, pickupTime, authorizedPerson, verificationMethod, notes } = body;

    if (!childId || !pickupDate || !pickupTime || !authorizedPerson) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, groupId: true },
    });

    if (!child) {
      return NextResponse.json({ error: "Dziecko nie istnieje" }, { status: 400 });
    }

    // Teachers can only create records for children in their group
    if (user.role === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
        select: { groupId: true },
      });
      if (staff?.groupId !== child.groupId) {
        return NextResponse.json({ error: "Brak dostępu do tego dziecka" }, { status: 403 });
      }
    }

    const parsedPickupDate = new Date(pickupDate);
    const parsedPickupTime = new Date(pickupTime);

    if (Number.isNaN(parsedPickupDate.getTime()) || Number.isNaN(parsedPickupTime.getTime())) {
      return NextResponse.json({ error: "Nieprawidłowa data lub godzina" }, { status: 400 });
    }

    const pickupRecord = await prisma.pickupRecord.create({
      data: {
        childId,
        pickupDate: parsedPickupDate,
        pickupTime: parsedPickupTime,
        authorizedPerson: authorizedPerson.trim(),
        verificationMethod: verificationMethod?.trim() || null,
        notes: notes?.trim() || null,
      },
      include: {
        child: {
          select: { id: true, name: true, surname: true, groupId: true },
        },
      },
    });

    return NextResponse.json(pickupRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating pickup record:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia rekordu odbioru" },
      { status: 500 }
    );
  }
}

