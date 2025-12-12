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

async function verifyAccessToMedication(user: SessionUser, medication: { childId: string }): Promise<boolean> {
  if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
    return true;
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: medication.childId, parentId: user.id },
    });
    return !!child;
  }

  if (user.role === "TEACHER") {
    const staff = await prisma.staff.findUnique({
      where: { userId: user.id },
      select: { groupId: true },
    });
    if (!staff?.groupId) return false;

    const child = await prisma.child.findFirst({
      where: { id: medication.childId, groupId: staff.groupId },
    });
    return !!child;
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

    const medication = await prisma.medication.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    if (!medication) {
      return NextResponse.json({ error: "Lek nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToMedication(user, medication);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego wpisu" }, { status: 403 });
    }

    return NextResponse.json(medication);
  } catch (error) {
    console.error("Error fetching medication:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania leku" },
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
    const { name, dosage, frequency, startDate, endDate, notes } = body;

    const existing = await prisma.medication.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lek nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToMedication(user, existing);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego wpisu" }, { status: 403 });
    }

    const updateData: {
      name?: string;
      dosage?: string | null;
      frequency?: string | null;
      startDate?: Date | null;
      endDate?: Date | null;
      notes?: string | null;
    } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (dosage !== undefined) {
      updateData.dosage = dosage?.trim() || null;
    }

    if (frequency !== undefined) {
      updateData.frequency = frequency?.trim() || null;
    }

    if (startDate !== undefined) {
      if (startDate && (typeof startDate === 'string' ? startDate.trim() !== '' : startDate)) {
        const parsedDate = new Date(startDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json({ error: "Nieprawidłowa data rozpoczęcia" }, { status: 400 });
        }
        if (parsedDate.getFullYear() > 9999) {
          return NextResponse.json({ error: "Rok daty nie może przekraczać 9999" }, { status: 400 });
        }
        updateData.startDate = parsedDate;
      } else {
        updateData.startDate = null;
      }
    }

    if (endDate !== undefined) {
      if (endDate && (typeof endDate === 'string' ? endDate.trim() !== '' : endDate)) {
        const parsedDate = new Date(endDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json({ error: "Nieprawidłowa data zakończenia" }, { status: 400 });
        }
        if (parsedDate.getFullYear() > 9999) {
          return NextResponse.json({ error: "Rok daty nie może przekraczać 9999" }, { status: 400 });
        }
        updateData.endDate = parsedDate;
      } else {
        updateData.endDate = null;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    const medication = await prisma.medication.update({
      where: { id },
      data: updateData,
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(medication);
  } catch (error) {
    console.error("Error updating medication:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji leku" },
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

    const existing = await prisma.medication.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lek nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToMedication(user, existing);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego wpisu" }, { status: 403 });
    }

    await prisma.medication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting medication:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania leku" },
      { status: 500 }
    );
  }
}

