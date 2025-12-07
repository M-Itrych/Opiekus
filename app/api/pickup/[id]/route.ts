import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";

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

async function verifyAccessToPickupRecord(
  user: SessionUser,
  record: { childId: string }
) {
  if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
    return true;
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: record.childId, parentId: user.id },
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
        where: { id: record.childId, groupId: staff.groupId },
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

    const pickupRecord = await prisma.pickupRecord.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, surname: true, groupId: true },
        },
      },
    });

    if (!pickupRecord) {
      return NextResponse.json({ error: "Rekord odbioru nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToPickupRecord(user, pickupRecord);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego rekordu" }, { status: 403 });
    }

    return NextResponse.json(pickupRecord);
  } catch (error) {
    console.error("Error fetching pickup record:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania rekordu odbioru" },
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

    if (!["TEACHER", "HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { pickupDate, pickupTime, authorizedPerson, verificationMethod, notes } = body;

    const existing = await prisma.pickupRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rekord odbioru nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToPickupRecord(user, existing);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego rekordu" }, { status: 403 });
    }

    const updateData: {
      pickupDate?: Date;
      pickupTime?: Date;
      authorizedPerson?: string;
      verificationMethod?: string | null;
      notes?: string | null;
    } = {};

    if (pickupDate !== undefined) {
      const parsedDate = new Date(pickupDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Nieprawidłowa data" }, { status: 400 });
      }
      updateData.pickupDate = parsedDate;
    }

    if (pickupTime !== undefined) {
      const parsedTime = new Date(pickupTime);
      if (Number.isNaN(parsedTime.getTime())) {
        return NextResponse.json({ error: "Nieprawidłowa godzina" }, { status: 400 });
      }
      updateData.pickupTime = parsedTime;
    }

    if (authorizedPerson !== undefined) {
      updateData.authorizedPerson = authorizedPerson.trim();
    }

    if (verificationMethod !== undefined) {
      updateData.verificationMethod = verificationMethod?.trim() || null;
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    const pickupRecord = await prisma.pickupRecord.update({
      where: { id },
      data: updateData,
      include: {
        child: {
          select: { id: true, name: true, surname: true, groupId: true },
        },
      },
    });

    return NextResponse.json(pickupRecord);
  } catch (error) {
    console.error("Error updating pickup record:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji rekordu odbioru" },
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

    if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.pickupRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rekord odbioru nie istnieje" }, { status: 404 });
    }

    await prisma.pickupRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pickup record:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania rekordu odbioru" },
      { status: 500 }
    );
  }
}

