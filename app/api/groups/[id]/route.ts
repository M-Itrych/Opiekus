import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (
      !payload ||
      (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { surname: "asc" },
        },
        staff: {
          include: {
            user: true,
          },
        },
        room: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupa nie znaleziona" },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching group details:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania szczegółów grupy" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (
      !payload ||
      (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, ageRange, maxCapacity, roomId } = body;

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: {
        name,
        ageRange,
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined,
        roomId,
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji grupy" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (
      !payload ||
      (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: { _count: { select: { children: true } } },
    });

    if (group && group._count.children > 0) {
      return NextResponse.json(
        { error: "Nie można usunąć grupy, do której są przypisane dzieci" },
        { status: 400 }
      );
    }

    await prisma.group.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Grupa została usunięta" });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania grupy" },
      { status: 500 }
    );
  }
}
