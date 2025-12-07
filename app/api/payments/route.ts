import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma, PaymentStatus } from "@prisma/client";

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

function normalizeStatus(value: unknown): PaymentStatus | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return Object.values(PaymentStatus).includes(upper as PaymentStatus)
    ? (upper as PaymentStatus)
    : null;
}

function ensureManager(user: SessionUser | null) {
  if (!user) {
    return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  }
  if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
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
    const childId = searchParams.get("childId");
    const status = searchParams.get("status");

    const where: Prisma.PaymentWhereInput = {};

    if (user.role === "PARENT") {
      const children = await prisma.child.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      where.childId = { in: childIds };
    }

    if (childId) {
      if (user.role === "PARENT") {
        const child = await prisma.child.findFirst({
          where: { id: childId, parentId: user.id },
        });
        if (!child) {
          return NextResponse.json({ error: "Brak dostępu do tego dziecka" }, { status: 403 });
        }
      }
      where.childId = childId;
    }

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) {
      where.status = normalizedStatus;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { dueDate: "desc" },
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania płatności" },
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
    const { childId, amount, description, dueDate, status } = body;

    if (!childId || !amount || !description || !dueDate) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      return NextResponse.json({ error: "Dziecko nie istnieje" }, { status: 400 });
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return NextResponse.json({ error: "Nieprawidłowa data" }, { status: 400 });
    }

    const normalizedStatus = normalizeStatus(status) ?? PaymentStatus.PENDING;

    const payment = await prisma.payment.create({
      data: {
        childId,
        amount: parseFloat(amount),
        description: description.trim(),
        dueDate: parsedDueDate,
        status: normalizedStatus,
      },
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia płatności" },
      { status: 500 }
    );
  }
}

