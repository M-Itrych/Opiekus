import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { MedicalDocumentType } from "@prisma/client";

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

async function verifyAccessToDocument(user: SessionUser, document: { childId: string }): Promise<boolean> {
  if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
    return true;
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: document.childId, parentId: user.id },
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
      where: { id: document.childId, groupId: staff.groupId },
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

    const document = await prisma.medicalDocument.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Dokument nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToDocument(user, document);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego dokumentu" }, { status: 403 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching medical document:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania dokumentu medycznego" },
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
    const { documentType, title, fileUrl, description, expiryDate } = body;

    const existing = await prisma.medicalDocument.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Dokument nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToDocument(user, existing);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego dokumentu" }, { status: 403 });
    }

    const updateData: {
      documentType?: MedicalDocumentType;
      title?: string;
      fileUrl?: string;
      description?: string | null;
      expiryDate?: Date | null;
    } = {};

    const normalizedType = normalizeMedicalDocumentType(documentType);
    if (normalizedType) {
      updateData.documentType = normalizedType;
    }

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (fileUrl !== undefined) {
      updateData.fileUrl = fileUrl;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (expiryDate !== undefined) {
      if (expiryDate && (typeof expiryDate === 'string' ? expiryDate.trim() !== '' : expiryDate)) {
        const parsedDate = new Date(expiryDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json({ error: "Nieprawidłowa data wygaśnięcia" }, { status: 400 });
        }
        if (parsedDate.getFullYear() > 9999) {
          return NextResponse.json({ error: "Rok daty nie może przekraczać 9999" }, { status: 400 });
        }
        updateData.expiryDate = parsedDate;
      } else {
        updateData.expiryDate = null;
      }
    }

    const document = await prisma.medicalDocument.update({
      where: { id },
      data: updateData,
      include: {
        child: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error updating medical document:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji dokumentu medycznego" },
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

    const existing = await prisma.medicalDocument.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Dokument nie istnieje" }, { status: 404 });
    }

    const hasAccess = await verifyAccessToDocument(user, existing);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego dokumentu" }, { status: 403 });
    }

    await prisma.medicalDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting medical document:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania dokumentu medycznego" },
      { status: 500 }
    );
  }
}

