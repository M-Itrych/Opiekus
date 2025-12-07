import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { MessageStatus } from "@prisma/client";

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

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, name: true, surname: true, role: true },
        },
        receiver: {
          select: { id: true, name: true, surname: true, role: true },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Wiadomość nie istnieje" }, { status: 404 });
    }

    if (message.senderId !== user.id && message.receiverId !== user.id) {
      return NextResponse.json({ error: "Brak dostępu do tej wiadomości" }, { status: 403 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania wiadomości" },
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
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isRead, status } = body;

    const existing = await prisma.message.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Wiadomość nie istnieje" }, { status: 404 });
    }

    if (existing.receiverId !== user.id && existing.senderId !== user.id) {
      return NextResponse.json({ error: "Brak dostępu do tej wiadomości" }, { status: 403 });
    }

    const updateData: { isRead?: boolean; status?: MessageStatus } = {};
    if (typeof isRead === "boolean" && existing.receiverId === user.id) {
      updateData.isRead = isRead;
      if (isRead) {
        updateData.status = "READ";
      }
    }
    if (status && ["SENT", "DELIVERED", "READ"].includes(status)) {
      updateData.status = status as MessageStatus;
    }

    const message = await prisma.message.update({
      where: { id },
      data: updateData,
      include: {
        sender: {
          select: { id: true, name: true, surname: true, role: true },
        },
        receiver: {
          select: { id: true, name: true, surname: true, role: true },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji wiadomości" },
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
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.message.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Wiadomość nie istnieje" }, { status: 404 });
    }

    if (existing.senderId !== user.id && existing.receiverId !== user.id) {
      return NextResponse.json({ error: "Brak dostępu do tej wiadomości" }, { status: 403 });
    }

    await prisma.message.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania wiadomości" },
      { status: 500 }
    );
  }
}

