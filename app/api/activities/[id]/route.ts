import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

type SessionRole = "ADMIN" | "HEADTEACHER" | "TEACHER" | "PARENT";
type SessionUser = {
  id: string;
  role: SessionRole;
};

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return payload as SessionUser;
}

async function getTeacherGroupId(userId: string) {
  const staffMember = await prisma.staff.findUnique({
    where: { userId },
    select: { groupId: true },
  });
  return staffMember?.groupId ?? null;
}

async function childBelongsToGroup(childId: string | null, groupId: string) {
  if (!childId) return true;
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { groupId: true },
  });
  return !!child && child.groupId === groupId;
}

function normalizeChildId(value: unknown) {
  if (value === null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "null") return null;
    return trimmed;
  }
  return undefined;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  if (!["TEACHER", "HEADTEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const payload = await req.json();
  const { title, description, date, activities: activitiesList } = payload;
  const hasChildId = Object.prototype.hasOwnProperty.call(payload, "childId");
  const normalizedChildId = hasChildId ? normalizeChildId(payload.childId) : undefined;

  const existing = await prisma.activity.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Aktywność nie znaleziona" }, { status: 404 });

  let teacherGroupId: string | null = null;
  if (user.role === "TEACHER") {
    teacherGroupId = await getTeacherGroupId(user.id as string);
    if (!teacherGroupId) {
      return NextResponse.json({ error: "Brak przypisanej grupy" }, { status: 400 });
    }
    if (existing.groupId !== teacherGroupId) {
      return NextResponse.json({ error: "Brak dostępu do tej aktywności" }, { status: 403 });
    }
    if (normalizedChildId && !(await childBelongsToGroup(normalizedChildId, teacherGroupId))) {
      return NextResponse.json({ error: "Dziecko nie należy do Twojej grupy" }, { status: 403 });
    }
  }

  const nextChildId = hasChildId
    ? normalizedChildId === undefined
      ? existing.childId
      : normalizedChildId
    : existing.childId;

  const updated = await prisma.activity.update({
    where: { id: params.id },
    data: {
      title: title || existing.title,
      description: description ?? existing.description,
      date: date ? new Date(date) : existing.date,
      childId: nextChildId,
      activities: activitiesList ?? existing.activities,
    },
    include: {
      child: { select: { id: true, name: true, surname: true } },
      group: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  if (!["TEACHER", "HEADTEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const existing = await prisma.activity.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Aktywność nie znaleziona" }, { status: 404 });

  if (user.role === "TEACHER") {
    const teacherGroupId = await getTeacherGroupId(user.id as string);
    if (!teacherGroupId || existing.groupId !== teacherGroupId) {
      return NextResponse.json({ error: "Brak dostępu do tej aktywności" }, { status: 403 });
    }
  }

  await prisma.activity.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}