import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { Prisma, RoomStatus } from "@prisma/client";
import { serializeRoom, RoomWithRelations } from "./utils";

type SessionRole = "ADMIN" | "HEADTEACHER";
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

  if (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN") {
    return null;
  }

  return payload as SessionUser;
}

function normalizeStatus(value: unknown): RoomStatus | undefined {
  if (!value || typeof value !== "string") return undefined;
  const upper = value.toUpperCase();
  if (["AVAILABLE", "OCCUPIED", "MAINTENANCE"].includes(upper)) {
    return upper as RoomStatus;
  }
  return undefined;
}

function normalizeCapacity(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  }

  try {
    const rooms = await prisma.room.findMany({
      include: {
        groups: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      rooms.map((room) => serializeRoom(room as RoomWithRelations))
    );
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ error: "Błąd podczas pobierania sal" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, capacity, description, status } = body;

    if (!name) {
      return NextResponse.json({ error: "Nazwa sali jest wymagana" }, { status: 400 });
    }

    const normalizedCapacity = normalizeCapacity(capacity);
    if (!normalizedCapacity || normalizedCapacity <= 0) {
      return NextResponse.json({ error: "Podaj prawidłową pojemność" }, { status: 400 });
    }

    const normalizedStatus = normalizeStatus(status) ?? RoomStatus.AVAILABLE;

    const room = await prisma.room.create({
      data: {
        name,
        capacity: normalizedCapacity,
        description: description || null,
        status: normalizedStatus,
      },
      include: {
        groups: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(serializeRoom(room as RoomWithRelations), { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ error: "Błąd podczas tworzenia sali" }, { status: 500 });
  }
}
