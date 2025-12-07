import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma, AnnouncementCategory } from "@prisma/client";

type SessionUser = {
  id: string;
  role: "ADMIN" | "HEADTEACHER" | "TEACHER" | "PARENT";
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

function ensurePublisher(user: SessionUser | null) {
  if (!user) {
    return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  }
  if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }
  return null;
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

type ParamsPromise =
  | { params: Promise<{ id: string }> }
  | { params: { id: string } };

async function resolveParams(context: ParamsPromise) {
  const maybePromise = context.params as Promise<{ id: string }> | { id: string };
  if (maybePromise && typeof (maybePromise as Promise<{ id: string }>).then === "function") {
    return await (maybePromise as Promise<{ id: string }>);
  }
  return maybePromise as { id: string };
}

export async function PATCH(req: Request, context: ParamsPromise) {
  try {
    const user = await getSessionUser();
    const authError = ensurePublisher(user);
    if (authError) return authError;

    const { id } = await resolveParams(context);
    const payload = await req.json();

    const updateData: Prisma.AnnouncementUpdateInput = {};

    if (typeof payload.title === "string" && payload.title.trim()) {
      updateData.title = payload.title.trim();
    }
    if (typeof payload.content === "string" && payload.content.trim()) {
      updateData.content = payload.content.trim();
    }
    if (typeof payload.category === "string" && payload.category.trim()) {
      updateData.category = payload.category.trim().toUpperCase() as AnnouncementCategory;
    }
    if (typeof payload.location !== "undefined") {
      updateData.location = payload.location ? String(payload.location) : null;
    }
    if (typeof payload.isImportant !== "undefined") {
      updateData.isImportant = Boolean(payload.isImportant);
    }

    const audience = normalizeAudience(payload.audience ?? payload.targetGroup);
    if (audience) {
      updateData.targetGroup = audience;
    }

    const eventDate = parseDate(payload.eventDate);
    if (payload.eventDate) {
      updateData.eventDate = eventDate;
    }

    if (payload.startTime !== undefined) {
      updateData.startTime = parseDate(payload.startTime);
    }

    if (payload.endTime !== undefined) {
      updateData.endTime = parseDate(payload.endTime);
    }

    if (payload.groupId !== undefined) {
      if (payload.groupId) {
        updateData.group = { connect: { id: payload.groupId } };
      } else {
        updateData.group = { disconnect: true };
      }
    }

    if (!Object.keys(updateData).length) {
      return NextResponse.json(
        { error: "Brak danych do aktualizacji" },
        { status: 400 }
      );
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { name: true, surname: true } },
        group: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji ogłoszenia" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: ParamsPromise) {
  try {
    const user = await getSessionUser();
    const authError = ensurePublisher(user);
    if (authError) return authError;

    const { id } = await resolveParams(context);

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania ogłoszenia" },
      { status: 500 }
    );
  }
}

