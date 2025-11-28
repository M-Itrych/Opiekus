import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma } from "@prisma/client";

type SessionRole = "ADMIN" | "HEADTEACHER" | "TEACHER" | "PARENT";
type SessionUser = {
  id: string;
  role: SessionRole;
};

const AUDIENCE_VALUES = ["ALL", "TEACHERS", "PARENTS"] as const;
type AnnouncementAudience = (typeof AUDIENCE_VALUES)[number];

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return payload as SessionUser;
}

function normalizeAudience(value: unknown): AnnouncementAudience | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return AUDIENCE_VALUES.includes(upper as AnnouncementAudience)
    ? (upper as AnnouncementAudience)
    : null;
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getTeacherGroupId(userId: string) {
  const staff = await prisma.staff.findUnique({
    where: { userId },
    select: { groupId: true },
  });
  return staff?.groupId ?? null;
}

async function getParentGroupIds(userId: string) {
  const children = await prisma.child.findMany({
    where: { parentId: userId, groupId: { not: null } },
    select: { groupId: true },
  });
  return Array.from(
    new Set(children.map((child) => child.groupId).filter(Boolean) as string[])
  );
}

function ensurePublisher(user: SessionUser | null) {
  if (!user) {
    return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  }
  if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedAudience = normalizeAudience(searchParams.get("audience"));

    const where: Prisma.AnnouncementWhereInput = {};

    if (user.role === "HEADTEACHER" || user.role === "ADMIN") {
      if (requestedAudience) {
        where.targetGroup = requestedAudience;
      }
    } else if (user.role === "TEACHER") {
      const teacherGroupId = await getTeacherGroupId(user.id);
      where.OR = [
        { targetGroup: { in: ["ALL", "TEACHERS"] } },
        { targetGroup: null },
        ...(teacherGroupId ? [{ groupId: teacherGroupId }] : []),
      ];
    } else if (user.role === "PARENT") {
      const groupIds = await getParentGroupIds(user.id);
      where.OR = [
        { targetGroup: { in: ["ALL", "PARENTS"] } },
        { targetGroup: null },
        ...(groupIds.length ? [{ groupId: { in: groupIds } }] : []),
      ];
    } else {
      return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { name: true, surname: true },
        },
        group: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania ogłoszeń" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const authError = ensurePublisher(user);
    if (authError) return authError;

    const body = await request.json();
    const {
      title,
      content,
      category,
      location,
      eventDate,
      startTime,
      endTime,
      isImportant,
      groupId,
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const normalizedAudience =
      normalizeAudience(body.audience ?? body.targetGroup) ?? "ALL";
    const normalizedCategory =
      typeof category === "string" && category.trim()
        ? category.trim().toUpperCase()
        : "INNE";

    const baseEventDate = parseDate(eventDate);
    const parsedStartTime = parseDate(startTime) ?? baseEventDate;
    const parsedEndTime = parseDate(endTime);

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: normalizedCategory,
        authorId: user!.id,
        isImportant: Boolean(isImportant),
        eventDate: baseEventDate,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        location: location?.trim() || null,
        targetGroup: normalizedAudience,
        groupId: groupId || null,
      },
      include: {
        author: { select: { name: true, surname: true } },
        group: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia ogłoszenia" },
      { status: 500 }
    );
  }
}

