import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma, MedicalDocumentType } from "@prisma/client";

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

function normalizeMedicalDocumentType(value: unknown): MedicalDocumentType | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return Object.values(MedicalDocumentType).includes(upper as MedicalDocumentType)
    ? (upper as MedicalDocumentType)
    : null;
}

async function verifyAccessToChild(user: SessionUser, childId: string): Promise<boolean> {
  if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
    return true;
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: user.id },
    });
    return !!child;
  }

  if (user.role === "TEACHER") {
    const staff = await prisma.staff.findUnique({
      where: { userId: user.id },
      select: { groupId: true },
    });
    if (!staff?.groupId) return false;

    const child = await prisma.child.findFirst({
      where: { id: childId, groupId: staff.groupId },
    });
    return !!child;
  }

  return false;
}

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");
    const documentType = searchParams.get("documentType");

    const where: Prisma.MedicalDocumentWhereInput = {};

    if (user.role === "PARENT") {
      const children = await prisma.child.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      where.childId = { in: childIds };
    } else if (user.role === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
        select: { groupId: true },
      });
      if (!staff?.groupId) {
        return NextResponse.json({ error: "Brak przypisanej grupy" }, { status: 400 });
      }
      const children = await prisma.child.findMany({
        where: { groupId: staff.groupId },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      where.childId = { in: childIds };
    }

    if (childId) {
      const hasAccess = await verifyAccessToChild(user, childId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Brak dostępu do tego dziecka" }, { status: 403 });
      }
      where.childId = childId;
    }

    const normalizedType = normalizeMedicalDocumentType(documentType);
    if (normalizedType) {
      where.documentType = normalizedType;
    }

    const documents = await prisma.medicalDocument.findMany({
      where,
      orderBy: { uploadDate: "desc" },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching medical documents:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania dokumentów medycznych" },
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
    const { childId, documentType, title, fileUrl, description, expiryDate } = body;

    if (!childId || !documentType || !title || !fileUrl) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const hasAccess = await verifyAccessToChild(user, childId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego dziecka" }, { status: 403 });
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      return NextResponse.json({ error: "Dziecko nie istnieje" }, { status: 400 });
    }

    const normalizedType = normalizeMedicalDocumentType(documentType);
    if (!normalizedType) {
      return NextResponse.json({ error: "Nieprawidłowy typ dokumentu" }, { status: 400 });
    }

    let parsedExpiryDate: Date | null = null;
    if (expiryDate && (typeof expiryDate === 'string' ? expiryDate.trim() !== '' : expiryDate)) {
      parsedExpiryDate = new Date(expiryDate);
      if (Number.isNaN(parsedExpiryDate.getTime())) {
        return NextResponse.json({ error: "Nieprawidłowa data wygaśnięcia" }, { status: 400 });
      }
      if (parsedExpiryDate.getFullYear() > 9999) {
        return NextResponse.json({ error: "Rok daty nie może przekraczać 9999" }, { status: 400 });
      }
    }

    const document = await prisma.medicalDocument.create({
      data: {
        childId,
        documentType: normalizedType,
        title: title.trim(),
        fileUrl,
        description: description?.trim() || null,
        expiryDate: parsedExpiryDate,
      },
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating medical document:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia dokumentu medycznego" },
      { status: 500 }
    );
  }
}

