import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

interface SessionPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  surname: string;
}

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

    // Check permissions
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

    if (
      !payload ||
      (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { groupId } = body;

    const updatedChild = await prisma.child.update({
      where: { id },
      data: {
        groupId: groupId === "null" ? null : groupId,
      },
    });

    return NextResponse.json(updatedChild);
  } catch (error) {
    console.error("Error updating child group:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji grupy dziecka" },
      { status: 500 }
    );
  }
}

