import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { RecommendationType } from "@prisma/client";

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

function normalizeRecommendationType(value: unknown): RecommendationType | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return Object.values(RecommendationType).includes(upper as RecommendationType)
    ? (upper as RecommendationType)
    : null;
}

async function verifyAccessToRecommendation(
  user: SessionUser,
  recommendation: { childId: string; authorId: string }
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
      where: { id: recommendation.childId, groupId: staff.groupId },
    });
    const canRead = !!child;
    // Teacher can only modify their own recommendations
    const canModify = canRead && recommendation.authorId === user.id;
    return { canRead, canModify };
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: recommendation.childId, parentId: user.id },
    });
    // Parents can only read recommendations, not modify them
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

    const recommendation = await prisma.childRecommendation.findUnique({
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

    if (!recommendation) {
      return NextResponse.json({ error: "Zalecenie nie istnieje" }, { status: 404 });
    }

    const { canRead } = await verifyAccessToRecommendation(user, recommendation);
    if (!canRead) {
      return NextResponse.json({ error: "Brak dostępu do tego zalecenia" }, { status: 403 });
    }

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("Error fetching recommendation:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania zalecenia" },
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
    const { type, content, date } = body;

    const existing = await prisma.childRecommendation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Zalecenie nie istnieje" }, { status: 404 });
    }

    const { canModify } = await verifyAccessToRecommendation(user, existing);
    if (!canModify) {
      return NextResponse.json({ error: "Brak uprawnień do edycji tego zalecenia" }, { status: 403 });
    }

    const updateData: {
      type?: RecommendationType;
      content?: string;
      date?: Date;
    } = {};

    const normalizedType = normalizeRecommendationType(type);
    if (normalizedType) {
      updateData.type = normalizedType;
    }

    if (content !== undefined) {
      updateData.content = content.trim();
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

    const recommendation = await prisma.childRecommendation.update({
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

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("Error updating recommendation:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji zalecenia" },
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

    const existing = await prisma.childRecommendation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Zalecenie nie istnieje" }, { status: 404 });
    }

    const { canModify } = await verifyAccessToRecommendation(user, existing);
    if (!canModify) {
      return NextResponse.json({ error: "Brak uprawnień do usunięcia tego zalecenia" }, { status: 403 });
    }

    await prisma.childRecommendation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recommendation:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania zalecenia" },
      { status: 500 }
    );
  }
}

