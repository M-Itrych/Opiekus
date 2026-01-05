import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { Prisma } from "@prisma/client";

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

function normalizeQueryParam(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null") return null;
  return trimmed;
}

function normalizeBodyId(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "null") return null;
    return trimmed;
  }
  return null;
}

async function getParentChildIds(parentId: string) {
  const children = await prisma.child.findMany({
    where: { parentId },
    select: { id: true },
  });
  return children.map((child) => child.id);
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

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const childId = normalizeQueryParam(searchParams.get("childId"));
  const groupId = normalizeQueryParam(searchParams.get("groupId"));
  const date = normalizeQueryParam(searchParams.get("date"));

  const where: Prisma.ActivityWhereInput = {};

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.date = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  if (user.role === "PARENT") {
    const childIds = await getParentChildIds(user.id as string);
    if (!childIds.length) return NextResponse.json([]);
    where.childId = { in: childIds };
  } else if (user.role === "TEACHER") {
    const teacherGroupId = await getTeacherGroupId(user.id as string);
    if (!teacherGroupId) {
      return NextResponse.json({ error: "Brak przypisanej grupy" }, { status: 400 });
    }
    where.groupId = teacherGroupId;
  } else if (user.role === "HEADTEACHER") {
    if (childId) where.childId = childId;
    if (groupId) where.groupId = groupId;
  } else {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      child: { select: { id: true, name: true, surname: true } },
      group: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(activities);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  if (!["TEACHER", "HEADTEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const payload = await req.json();
  const {
    title,
    description,
    date,
    activities: activitiesList,
    breakfast,
    secondBreakfast,
    lunch,
    snack,
    napStart,
    napEnd
  } = payload;
  const requestedGroupId = normalizeBodyId(payload.groupId);
  const requestedChildId = normalizeBodyId(payload.childId);

  if (!title || !date) {
    return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
  }

  let targetGroupId = requestedGroupId;

  if (user.role === "TEACHER") {
    const teacherGroupId = await getTeacherGroupId(user.id as string);
    if (!teacherGroupId) {
      return NextResponse.json({ error: "Brak przypisanej grupy" }, { status: 400 });
    }

    if (requestedGroupId && requestedGroupId !== teacherGroupId) {
      return NextResponse.json({ error: "Brak uprawnień do tej grupy" }, { status: 403 });
    }

    const childAllowed = await childBelongsToGroup(requestedChildId, teacherGroupId);
    if (!childAllowed) {
      return NextResponse.json({ error: "Dziecko nie należy do Twojej grupy" }, { status: 403 });
    }

    targetGroupId = teacherGroupId;
  }

  if (!targetGroupId) {
    return NextResponse.json({ error: "Brak przypisanej grupy" }, { status: 400 });
  }

  const activityData = {
    title,
    description: description || null,
    date: new Date(date),
    groupId: targetGroupId,
    childId: requestedChildId,
    activities: activitiesList || [],
    breakfast: !!breakfast,
    secondBreakfast: !!secondBreakfast,
    lunch: !!lunch,
    snack: !!snack,
    napStart: napStart || null,
    napEnd: napEnd || null,
  };

  let activity;
  if (requestedChildId) {
    const activityDataForSearch = new Date(date);
    const startOfDay = new Date(activityDataForSearch);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(activityDataForSearch);
    endOfDay.setHours(23, 59, 59, 999);

    const existingActivity = await prisma.activity.findFirst({
      where: {
        childId: requestedChildId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingActivity) {
      activity = await prisma.activity.update({
        where: { id: existingActivity.id },
        data: activityData,
      });
    } else {
      activity = await prisma.activity.create({
        data: activityData,
      });
    }
  } else {
    activity = await prisma.activity.create({
      data: activityData,
    });
  }

  return NextResponse.json(activity, { status: 201 });
}