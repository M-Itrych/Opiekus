import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma } from "@prisma/client";

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

function ensureManager(user: SessionUser | null) {
  if (!user) {
    return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  }
  if (!["HEADTEACHER", "ADMIN", "TEACHER"].includes(user.role)) {
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
    const groupId = searchParams.get("groupId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const mealType = searchParams.get("mealType");

    const where: Prisma.MealPlanWhereInput = {};

    // Filter by group
    if (groupId) {
      where.groupId = groupId;
    }

    // Filter by specific date
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.date = where.date || {};
      if (startDate) {
        (where.date as Prisma.DateTimeFilter).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Prisma.DateTimeFilter).lte = new Date(endDate);
      }
    }

    // Filter by meal type
    if (mealType) {
      where.mealType = mealType;
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where,
      orderBy: [{ date: "desc" }, { mealType: "asc" }],
      include: {
        group: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania jadłospisu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const authError = ensureManager(user);
    if (authError) return authError;

    const body = await request.json();
    const { groupId, date, mealType, name, description, allergens } = body;

    if (!date || !mealType || !name) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Nieprawidłowa data" }, { status: 400 });
    }

    // Verify group exists if provided
    if (groupId) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { id: true },
      });
      if (!group) {
        return NextResponse.json({ error: "Grupa nie istnieje" }, { status: 400 });
      }
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        groupId: groupId || null,
        date: parsedDate,
        mealType: mealType.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        allergens: allergens || [],
      },
      include: {
        group: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(mealPlan, { status: 201 });
  } catch (error) {
    console.error("Error creating meal plan:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia jadłospisu" },
      { status: 500 }
    );
  }
}

