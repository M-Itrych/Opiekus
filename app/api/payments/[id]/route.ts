import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { PaymentStatus } from "@prisma/client";

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

async function verifyAccessToPayment(user: SessionUser, payment: { childId: string }) {
  if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
    return true;
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: payment.childId, parentId: user.id },
    });
    return !!child;
  }

  return false;
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

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Płatność nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToPayment(user, payment);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tej płatności" }, { status: 403 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania płatności" },
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
    const { status, paidDate, amount, description, dueDate } = body;

    const existing = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Płatność nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToPayment(user, existing);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tej płatności" }, { status: 403 });
    }

    const updateData: {
      status?: PaymentStatus;
      paidDate?: Date | null;
      amount?: number;
      description?: string;
      dueDate?: Date;
    } = {};

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) {
      updateData.status = normalizedStatus;
      if (normalizedStatus === PaymentStatus.PAID && !existing.paidDate) {
        updateData.paidDate = new Date();
      }
    }

    if (paidDate !== undefined) {
      updateData.paidDate = paidDate ? new Date(paidDate) : null;
    }

    if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
      if (amount !== undefined) {
        updateData.amount = parseFloat(amount);
      }
      if (description !== undefined) {
        updateData.description = description.trim();
      }
      if (dueDate !== undefined) {
        updateData.dueDate = new Date(dueDate);
      }
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji płatności" },
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

    if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Płatność nie istnieje" }, { status: 404 });
    }

    await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania płatności" },
      { status: 500 }
    );
  }
}

