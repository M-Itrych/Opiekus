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

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "inbox" | "sent" | "all"
    const unreadOnly = searchParams.get("unread") === "true";

    let where: Prisma.MessageWhereInput = {};

    if (type === "sent") {
      where = { senderId: user.id };
    } else if (type === "inbox") {
      where = { receiverId: user.id };
    } else {
      where = {
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      };
    }

    if (unreadOnly) {
      where = {
        ...where,
        receiverId: user.id,
        isRead: false,
      };
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, name: true, surname: true, role: true },
        },
        receiver: {
          select: { id: true, name: true, surname: true, role: true },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania wiadomości" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, subject, body: messageBody } = body;

    if (!receiverId || !subject || !messageBody) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "Odbiorca nie istnieje" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId,
        subject: subject.trim(),
        body: messageBody.trim(),
        status: "SENT",
        isRead: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, surname: true, role: true },
        },
        receiver: {
          select: { id: true, name: true, surname: true, role: true },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Błąd podczas wysyłania wiadomości" },
      { status: 500 }
    );
  }
}

