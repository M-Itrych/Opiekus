import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { Prisma, RoomStatus } from "@prisma/client";
import { serializeRoom, RoomWithRelations } from "../utils";

type SessionRole = "ADMIN" | "HEADTEACHER";

async function authorize() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    return { error: NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 }) };
  }

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")) {
    return { error: NextResponse.json({ error: "Brak uprawnień" }, { status: 403 }) };
  }

  return { payload };
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

type ParamsPromise = { params: Promise<{ id: string }> } | { params: { id: string } };

async function resolveParams(context: ParamsPromise) {
  const maybePromise = context.params as Promise<{ id: string }> | { id: string };
  if (maybePromise && typeof (maybePromise as Promise<{ id: string }>).then === "function") {
    return await (maybePromise as Promise<{ id: string }>);
  }
  return maybePromise as { id: string };
}

export async function GET(_: Request, context: ParamsPromise) {
  const { error } = await authorize();
  if (error) return error;

  const { id } = await resolveParams(context);

  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        groups: { select: { id: true, name: true } },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Sala nie znaleziona" }, { status: 404 });
    }

    return NextResponse.json(serializeRoom(room as RoomWithRelations));
  } catch (err) {
    console.error("Error reading room:", err);
    return NextResponse.json(
      { error: "Błąd podczas pobierania sali" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: ParamsPromise) {
  const { error } = await authorize();
  if (error) return error;

  const { id } = await resolveParams(context);

  try {
    const body = await req.json();
    const { name, capacity, status, description } = body;

    const updateData: Prisma.RoomUpdateInput = {};

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    const normalizedCapacity = normalizeCapacity(capacity);
    if (typeof normalizedCapacity !== "undefined") {
      if (normalizedCapacity <= 0) {
        return NextResponse.json({ error: "Nieprawidłowa pojemność" }, { status: 400 });
      }
      updateData.capacity = normalizedCapacity;
    }

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) {
      updateData.status = normalizedStatus;
    }

    if (typeof description !== "undefined") {
      updateData.description = description ? String(description) : null;
    }

    if (!Object.keys(updateData).length) {
      return NextResponse.json(
        { error: "Brak danych do aktualizacji" },
        { status: 400 }
      );
    }

    const updated = await prisma.room.update({
      where: { id },
      data: updateData,
      include: {
        groups: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(serializeRoom(updated as RoomWithRelations));
  } catch (err) {
    console.error("Error updating room:", err);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji sali" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: ParamsPromise) {
  const { error } = await authorize();
  if (error) return error;

  const { id } = await resolveParams(context);

  try {
    await prisma.group.updateMany({
      where: { roomId: id },
      data: { roomId: null },
    });

    await prisma.room.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting room:", err);
    return NextResponse.json(
      { error: "Błąd podczas usuwania sali" },
      { status: 500 }
    );
  }
}

