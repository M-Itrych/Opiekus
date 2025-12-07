import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { DocumentStatus } from "@prisma/client";

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

function normalizeStatus(value: unknown): DocumentStatus | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return Object.values(DocumentStatus).includes(upper as DocumentStatus)
    ? (upper as DocumentStatus)
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

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Dokument nie istnieje" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania dokumentu" },
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
    const authError = ensureManager(user);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { title, description, fileUrl, status, groupIds } = body;

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Dokument nie istnieje" }, { status: 404 });
    }

    const updateData: {
      title?: string;
      description?: string | null;
      fileUrl?: string;
      status?: DocumentStatus;
    } = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (fileUrl !== undefined) {
      updateData.fileUrl = fileUrl.trim();
    }

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) {
      updateData.status = normalizedStatus;
    }

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        groups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (groupIds !== undefined) {
      const groupIdsArray = Array.isArray(groupIds) ? groupIds.filter((id: unknown) => typeof id === "string" && id.trim()) : [];
      
      await prisma.documentGroup.deleteMany({
        where: { documentId: id },
      });

      if (groupIdsArray.length > 0) {
        await prisma.documentGroup.createMany({
          data: groupIdsArray.map((groupId: string) => ({
            documentId: id,
            groupId: groupId.trim(),
          })),
        });
      }

      const documentWithGroups = await prisma.document.findUnique({
        where: { id },
        include: {
          groups: {
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json(documentWithGroups);
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji dokumentu" },
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
    const authError = ensureManager(user);
    if (authError) return authError;

    const { id } = await params;

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Dokument nie istnieje" }, { status: 404 });
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania dokumentu" },
      { status: 500 }
    );
  }
}
