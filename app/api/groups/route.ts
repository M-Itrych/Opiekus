import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload || (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")) {
       return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: { children: true },
        },
        room: true,
        staff: {
          where: {
            staffRole: "NAUCZYCIEL",
          },
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      ageRange: group.ageRange,
      childrenCount: group._count.children,
      maxCapacity: group.maxCapacity,
      teacherName: group.staff[0]
        ? `${group.staff[0].user.name} ${group.staff[0].user.surname}`
        : "Brak nauczyciela",
      room: group.room ? group.room.name : "Brak sali",
    }));

    return NextResponse.json(formattedGroups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania grup" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try { 
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload || (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")) {
       return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const body = await request.json();
    const { name, ageRange, maxCapacity, roomId, breakfastPrice, lunchPrice, snackPrice } = body;

    if (!name || !ageRange || !maxCapacity) {
      return NextResponse.json(
        { error: "Wymagane pola: nazwa, przedział wiekowy, pojemność" },
        { status: 400 }
      );
    }

    const newGroup = await prisma.group.create({
      data: {
        name,
        ageRange,
        maxCapacity: parseInt(maxCapacity),
        roomId: roomId || null,
        breakfastPrice: breakfastPrice !== undefined ? parseFloat(breakfastPrice) : 5.0,
        lunchPrice: lunchPrice !== undefined ? parseFloat(lunchPrice) : 12.0,
        snackPrice: snackPrice !== undefined ? parseFloat(snackPrice) : 4.0,
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia grupy" },
      { status: 500 }
    );
  }
}
