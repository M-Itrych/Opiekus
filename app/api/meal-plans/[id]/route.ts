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

function ensureManager(user: SessionUser | null) {
  if (!user) {
    return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  }
  if (!["HEADTEACHER", "ADMIN", "TEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }
  return null;
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

    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        group: {
          select: { id: true, name: true },
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: "Jadłospis nie istnieje" }, { status: 404 });
    }

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania jadłospisu" },
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
    const authError = ensureManager(user);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { groupId, date, mealType, name, description, allergens } = body;

    const existing = await prisma.mealPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Jadłospis nie istnieje" }, { status: 404 });
    }

    const updateData: {
      groupId?: string | null;
      date?: Date;
      mealType?: string;
      name?: string;
      description?: string | null;
      allergens?: string[];
    } = {};

    if (groupId !== undefined) {
      if (groupId) {
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          select: { id: true },
        });
        if (!group) {
          return NextResponse.json({ error: "Grupa nie istnieje" }, { status: 400 });
        }
      }
      updateData.groupId = groupId || null;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Nieprawidłowa data" }, { status: 400 });
      }
      updateData.date = parsedDate;
    }

    if (mealType !== undefined) {
      updateData.mealType = mealType.trim();
    }

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (allergens !== undefined) {
      updateData.allergens = allergens;
    }

    const mealPlan = await prisma.mealPlan.update({
      where: { id },
      data: updateData,
      include: {
        group: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error("Error updating meal plan:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji jadłospisu" },
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
    const authError = ensureManager(user);
    if (authError) return authError;

    const { id } = await params;

    const existing = await prisma.mealPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Jadłospis nie istnieje" }, { status: 404 });
    }

    await prisma.mealPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania jadłospisu" },
      { status: 500 }
    );
  }
}

