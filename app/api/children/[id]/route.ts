import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { DietType } from "@prisma/client";

interface SessionPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  surname: string;
}

const VALID_DIET_TYPES: DietType[] = ["STANDARD", "VEGETARIAN", "VEGAN", "GLUTEN_FREE", "LACTOSE_FREE", "CUSTOM"];

async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return payload as unknown as SessionPayload;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const { id } = await params;

    const child = await prisma.child.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            ageRange: true,
          },
        },
        attendances: {
          orderBy: { date: "desc" },
          take: 10,
        },
        consents: true,
        pickupRecords: {
          orderBy: { pickupDate: "desc" },
          take: 5,
        },
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: "Nie znaleziono dziecka" },
        { status: 404 }
      );
    }

    if (user.role === "PARENT" && child.parentId !== user.id) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    if (user.role === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
        select: { groupId: true },
      });

      if (!staff?.groupId || staff.groupId !== child.groupId) {
        return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
      }
    }

    return NextResponse.json(child);
  } catch (error) {
    console.error("Error fetching child:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania danych dziecka" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const { id } = await params;

    const existingChild = await prisma.child.findUnique({
      where: { id },
      select: { parentId: true },
    });

    if (!existingChild) {
      return NextResponse.json(
        { error: "Nie znaleziono dziecka" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      name,
      surname,
      age,
      groupId, 
      hasImageConsent, 
      hasDataConsent, 
      allergies, 
      specialNeeds,
      diet
    } = body;

    const updateData: Record<string, unknown> = {};

    if (payload.role === "PARENT") {
      if (existingChild.parentId !== payload.id) {
        return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
      }

      if (name !== undefined) updateData.name = name.trim();
      if (surname !== undefined) updateData.surname = surname.trim();
      if (age !== undefined) updateData.age = parseInt(age);
      if (hasImageConsent !== undefined) updateData.hasImageConsent = hasImageConsent;
      if (hasDataConsent !== undefined) updateData.hasDataConsent = hasDataConsent;
      if (allergies !== undefined) updateData.allergies = allergies;
      if (specialNeeds !== undefined) updateData.specialNeeds = specialNeeds || null;
      // Parents can update diet
      if (diet !== undefined && VALID_DIET_TYPES.includes(diet)) {
        updateData.diet = diet;
      }
    } else if (payload.role === "HEADTEACHER" || payload.role === "ADMIN") {
      if (name !== undefined) updateData.name = name.trim();
      if (surname !== undefined) updateData.surname = surname.trim();
      if (age !== undefined) updateData.age = parseInt(age);
      if (groupId !== undefined) updateData.groupId = groupId === "null" ? null : groupId;
      if (hasImageConsent !== undefined) updateData.hasImageConsent = hasImageConsent;
      if (hasDataConsent !== undefined) updateData.hasDataConsent = hasDataConsent;
      if (allergies !== undefined) updateData.allergies = allergies;
      if (specialNeeds !== undefined) updateData.specialNeeds = specialNeeds || null;
      if (diet !== undefined && VALID_DIET_TYPES.includes(diet)) {
        updateData.diet = diet;
      }
    } else {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const updatedChild = await prisma.child.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedChild);
  } catch (error) {
    console.error("Error updating child:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji danych dziecka" },
      { status: 500 }
    );
  }
}

