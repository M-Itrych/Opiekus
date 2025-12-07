import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma, ConsentType, ConsentStatus } from "@prisma/client";

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

function normalizeConsentType(value: unknown): ConsentType | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return Object.values(ConsentType).includes(upper as ConsentType)
    ? (upper as ConsentType)
    : null;
}

function normalizeConsentStatus(value: unknown): ConsentStatus | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return Object.values(ConsentStatus).includes(upper as ConsentStatus)
    ? (upper as ConsentStatus)
    : null;
}

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");
    const consentType = searchParams.get("consentType");
    const status = searchParams.get("status");

    const where: Prisma.ConsentWhereInput = {};

    // Parents can only see their children's consents
    if (user.role === "PARENT") {
      const children = await prisma.child.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      where.childId = { in: childIds };
    }

    // Filter by specific child
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

    // Filter by consent type
    const normalizedType = normalizeConsentType(consentType);
    if (normalizedType) {
      where.consentType = normalizedType;
    }

    // Filter by status
    const normalizedStatus = normalizeConsentStatus(status);
    if (normalizedStatus) {
      where.status = normalizedStatus;
    }

    const consents = await prisma.consent.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            surname: true,
            parent: {
              select: { id: true, name: true, surname: true },
            },
          },
        },
      },
    });

    return NextResponse.json(consents);
  } catch (error) {
    console.error("Error fetching consents:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania zgód" },
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
    const { childId, consentType, status, expiryDate } = body;

    if (!childId || !consentType) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    // Verify access to child
    if (user.role === "PARENT") {
      const child = await prisma.child.findFirst({
        where: { id: childId, parentId: user.id },
      });
      if (!child) {
        return NextResponse.json({ error: "Brak dostępu do tego dziecka" }, { status: 403 });
      }
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      return NextResponse.json({ error: "Dziecko nie istnieje" }, { status: 400 });
    }

    const normalizedType = normalizeConsentType(consentType);
    if (!normalizedType) {
      return NextResponse.json({ error: "Nieprawidłowy typ zgody" }, { status: 400 });
    }

    const normalizedStatus = normalizeConsentStatus(status) ?? ConsentStatus.PENDING;

    let parsedExpiryDate: Date | null = null;
    if (expiryDate) {
      parsedExpiryDate = new Date(expiryDate);
      if (Number.isNaN(parsedExpiryDate.getTime())) {
        return NextResponse.json({ error: "Nieprawidłowa data wygaśnięcia" }, { status: 400 });
      }
    }

    // Check if consent of this type already exists for this child
    const existing = await prisma.consent.findFirst({
      where: {
        childId,
        consentType: normalizedType,
      },
    });

    if (existing) {
      // Update existing consent
      const consent = await prisma.consent.update({
        where: { id: existing.id },
        data: {
          status: normalizedStatus,
          date: new Date(),
          expiryDate: parsedExpiryDate,
        },
        include: {
          child: {
            select: { id: true, name: true, surname: true },
          },
        },
      });
      return NextResponse.json(consent);
    }

    const consent = await prisma.consent.create({
      data: {
        childId,
        consentType: normalizedType,
        status: normalizedStatus,
        date: new Date(),
        expiryDate: parsedExpiryDate,
      },
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(consent, { status: 201 });
  } catch (error) {
    console.error("Error creating consent:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia zgody" },
      { status: 500 }
    );
  }
}

