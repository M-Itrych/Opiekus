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

async function verifyAccessToDisease(user: SessionUser, disease: { childId: string }): Promise<boolean> {
  if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
    return true;
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: disease.childId, parentId: user.id },
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
      where: { id: disease.childId, groupId: staff.groupId },
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

    const disease = await prisma.chronicDisease.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    if (!disease) {
      return NextResponse.json({ error: "Choroba przewlekła nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToDisease(user, disease);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego wpisu" }, { status: 403 });
    }

    return NextResponse.json(disease);
  } catch (error) {
    console.error("Error fetching chronic disease:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania choroby przewlekłej" },
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
    const { name, description, diagnosedAt, notes } = body;

    const existing = await prisma.chronicDisease.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Choroba przewlekła nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToDisease(user, existing);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego wpisu" }, { status: 403 });
    }

    const updateData: {
      name?: string;
      description?: string | null;
      diagnosedAt?: Date | null;
      notes?: string | null;
    } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (diagnosedAt !== undefined) {
      if (diagnosedAt && (typeof diagnosedAt === 'string' ? diagnosedAt.trim() !== '' : diagnosedAt)) {
        const parsedDate = new Date(diagnosedAt);
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json({ error: "Nieprawidłowa data diagnozy" }, { status: 400 });
        }
        if (parsedDate.getFullYear() > 9999) {
          return NextResponse.json({ error: "Rok daty nie może przekraczać 9999" }, { status: 400 });
        }
        updateData.diagnosedAt = parsedDate;
      } else {
        updateData.diagnosedAt = null;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    const disease = await prisma.chronicDisease.update({
      where: { id },
      data: updateData,
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(disease);
  } catch (error) {
    console.error("Error updating chronic disease:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji choroby przewlekłej" },
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

    const existing = await prisma.chronicDisease.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Choroba przewlekła nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToDisease(user, existing);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego wpisu" }, { status: 403 });
    }

    await prisma.chronicDisease.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chronic disease:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania choroby przewlekłej" },
      { status: 500 }
    );
  }
}

