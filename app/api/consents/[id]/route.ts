import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { ConsentStatus } from "@prisma/client";

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

function normalizeConsentStatus(value: unknown): ConsentStatus | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return Object.values(ConsentStatus).includes(upper as ConsentStatus)
    ? (upper as ConsentStatus)
    : null;
}

async function verifyAccessToConsent(user: SessionUser, consent: { childId: string }) {
  if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
    return true;
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: consent.childId, parentId: user.id },
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

    const consent = await prisma.consent.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    if (!consent) {
      return NextResponse.json({ error: "Zgoda nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToConsent(user, consent);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tej zgody" }, { status: 403 });
    }

    return NextResponse.json(consent);
  } catch (error) {
    console.error("Error fetching consent:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania zgody" },
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
    const { status, expiryDate } = body;

    const existing = await prisma.consent.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Zgoda nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToConsent(user, existing);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tej zgody" }, { status: 403 });
    }

    const updateData: {
      status?: ConsentStatus;
      expiryDate?: Date | null;
      date?: Date;
    } = {};

    const normalizedStatus = normalizeConsentStatus(status);
    if (normalizedStatus) {
      updateData.status = normalizedStatus;
      updateData.date = new Date(); // Update the consent date when status changes
    }

    if (expiryDate !== undefined) {
      if (expiryDate) {
        const parsedDate = new Date(expiryDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json({ error: "Nieprawidłowa data wygaśnięcia" }, { status: 400 });
        }
        updateData.expiryDate = parsedDate;
      } else {
        updateData.expiryDate = null;
      }
    }

    const consent = await prisma.consent.update({
      where: { id },
      data: updateData,
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(consent);
  } catch (error) {
    console.error("Error updating consent:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji zgody" },
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

    // Only managers can delete consents
    if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.consent.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Zgoda nie istnieje" }, { status: 404 });
    }

    await prisma.consent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting consent:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania zgody" },
      { status: 500 }
    );
  }
}

