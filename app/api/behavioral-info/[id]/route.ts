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

async function verifyAccessToBehavioralInfo(
  user: SessionUser,
  info: { childId: string; authorId: string }
): Promise<{ canRead: boolean; canModify: boolean }> {
  if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
    return { canRead: true, canModify: true };
  }

  if (user.role === "TEACHER") {
    const staff = await prisma.staff.findUnique({
      where: { userId: user.id },
      select: { groupId: true },
    });
    if (!staff?.groupId) return { canRead: false, canModify: false };

    const child = await prisma.child.findFirst({
      where: { id: info.childId, groupId: staff.groupId },
    });
    const canRead = !!child;
    const canModify = canRead && info.authorId === user.id;
    return { canRead, canModify };
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: info.childId, parentId: user.id },
    });
    return { canRead: !!child, canModify: false };
  }

  return { canRead: false, canModify: false };
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

    const behavioralInfo = await prisma.behavioralInfo.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
        author: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    if (!behavioralInfo) {
      return NextResponse.json({ error: "Informacja behawioralna nie istnieje" }, { status: 404 });
    }

    const { canRead } = await verifyAccessToBehavioralInfo(user, behavioralInfo);
    if (!canRead) {
      return NextResponse.json({ error: "Brak dostępu do tej informacji" }, { status: 403 });
    }

    return NextResponse.json(behavioralInfo);
  } catch (error) {
    console.error("Error fetching behavioral info:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania informacji behawioralnej" },
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
    const { behavior, context, notes, date } = body;

    const existing = await prisma.behavioralInfo.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Informacja behawioralna nie istnieje" }, { status: 404 });
    }

    const { canModify } = await verifyAccessToBehavioralInfo(user, existing);
    if (!canModify) {
      return NextResponse.json({ error: "Brak uprawnień do edycji tej informacji" }, { status: 403 });
    }

    const updateData: {
      behavior?: string;
      context?: string | null;
      notes?: string | null;
      date?: Date;
    } = {};

    if (behavior !== undefined) {
      updateData.behavior = behavior.trim();
    }

    if (context !== undefined) {
      updateData.context = context?.trim() || null;
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    if (date !== undefined) {
      if (date && (typeof date === 'string' ? date.trim() !== '' : date)) {
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json({ error: "Nieprawidłowa data" }, { status: 400 });
        }
        if (parsedDate.getFullYear() > 9999) {
          return NextResponse.json({ error: "Rok daty nie może przekraczać 9999" }, { status: 400 });
        }
        updateData.date = parsedDate;
      }
    }

    const behavioralInfo = await prisma.behavioralInfo.update({
      where: { id },
      data: updateData,
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
        author: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(behavioralInfo);
  } catch (error) {
    console.error("Error updating behavioral info:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji informacji behawioralnej" },
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

    const existing = await prisma.behavioralInfo.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Informacja behawioralna nie istnieje" }, { status: 404 });
    }

    const { canModify } = await verifyAccessToBehavioralInfo(user, existing);
    if (!canModify) {
      return NextResponse.json({ error: "Brak uprawnień do usunięcia tej informacji" }, { status: 403 });
    }

    await prisma.behavioralInfo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting behavioral info:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania informacji behawioralnej" },
      { status: 500 }
    );
  }
}

