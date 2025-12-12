import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma, RecommendationType } from "@prisma/client";

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

async function verifyAccessToChild(user: SessionUser, childId: string): Promise<boolean> {
  if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
    return true;
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: user.id },
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
      where: { id: childId, groupId: staff.groupId },
    });
    return !!child;
  }

  return false;
}

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");
    const type = searchParams.get("type");

    const where: Prisma.ChildRecommendationWhereInput = {};

    if (user.role === "PARENT") {
      const children = await prisma.child.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      where.childId = { in: childIds };
    } else if (user.role === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
        select: { groupId: true },
      });
      if (!staff?.groupId) {
        return NextResponse.json({ error: "Brak przypisanej grupy" }, { status: 400 });
      }
      const children = await prisma.child.findMany({
        where: { groupId: staff.groupId },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      where.childId = { in: childIds };
    }

    if (childId) {
      const hasAccess = await verifyAccessToChild(user, childId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Brak dostępu do tego dziecka" }, { status: 403 });
      }
      where.childId = childId;
    }

    const normalizedType = normalizeRecommendationType(type);
    if (normalizedType) {
      where.type = normalizedType;
    }

    const recommendations = await prisma.childRecommendation.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania zaleceń" },
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

    if (!["TEACHER", "HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień do dodawania zaleceń" }, { status: 403 });
    }

    const body = await request.json();
    const { childId, type, content, date } = body;

    if (!childId || !type || !content) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const hasAccess = await verifyAccessToChild(user, childId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego dziecka" }, { status: 403 });
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      return NextResponse.json({ error: "Dziecko nie istnieje" }, { status: 400 });
    }

    const normalizedType = normalizeRecommendationType(type);
    if (!normalizedType) {
      return NextResponse.json({ error: "Nieprawidłowy typ zalecenia" }, { status: 400 });
    }

    let parsedDate: Date = new Date();
    if (date && (typeof date === 'string' ? date.trim() !== '' : date)) {
      parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Nieprawidłowa data" }, { status: 400 });
      }
      if (parsedDate.getFullYear() > 9999) {
        return NextResponse.json({ error: "Rok daty nie może przekraczać 9999" }, { status: 400 });
      }
    }

    const recommendation = await prisma.childRecommendation.create({
      data: {
        childId,
        authorId: user.id,
        type: normalizedType,
        content: content.trim(),
        date: parsedDate,
      },
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
        author: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(recommendation, { status: 201 });
  } catch (error) {
    console.error("Error creating recommendation:", error);
    return NextResponse.json(
      { error: "Błąd podczas dodawania zalecenia" },
      { status: 500 }
    );
  }
}

