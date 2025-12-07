import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, type SessionUser } from "@/lib/session";

async function getSessionUser(): Promise<SessionUser | null> {
  const payload = await verifySession();
  if (!payload) return null;
  return payload as SessionUser;
}

async function verifyAccessToAuthorizedPerson(
  user: SessionUser,
  authorizedPersonId: string
): Promise<{ hasAccess: boolean; authorizedPerson: { childId: string } | null }> {
  const authorizedPerson = await prisma.authorizedPerson.findUnique({
    where: { id: authorizedPersonId },
    select: { childId: true },
  });

  if (!authorizedPerson) {
    return { hasAccess: false, authorizedPerson: null };
  }

  if (user.role === "ADMIN" || user.role === "HEADTEACHER") {
    return { hasAccess: true, authorizedPerson };
  }

  if (user.role === "PARENT") {
    const child = await prisma.child.findFirst({
      where: { id: authorizedPerson.childId, parentId: user.id },
    });
    return { hasAccess: !!child, authorizedPerson };
  }

  return { hasAccess: false, authorizedPerson };
}

// GET - Get a specific authorized person
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

    const { hasAccess, authorizedPerson } = await verifyAccessToAuthorizedPerson(user, id);
    
    if (!authorizedPerson) {
      return NextResponse.json({ error: "Osoba upoważniona nie istnieje" }, { status: 404 });
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
    }

    const person = await prisma.authorizedPerson.findUnique({
      where: { id },
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error("Error fetching authorized person:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania osoby upoważnionej" },
      { status: 500 }
    );
  }
}

// PATCH - Update an authorized person
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    if (!["PARENT", "HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const { hasAccess, authorizedPerson } = await verifyAccessToAuthorizedPerson(user, id);
    
    if (!authorizedPerson) {
      return NextResponse.json({ error: "Osoba upoważniona nie istnieje" }, { status: 404 });
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
    }

    const body = await request.json();
    const { name, surname, relation, phone, idNumber, isActive } = body;

    const updateData: {
      name?: string;
      surname?: string;
      relation?: string;
      phone?: string | null;
      idNumber?: string | null;
      isActive?: boolean;
    } = {};

    if (name !== undefined) updateData.name = name.trim();
    if (surname !== undefined) updateData.surname = surname.trim();
    if (relation !== undefined) updateData.relation = relation.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (idNumber !== undefined) updateData.idNumber = idNumber?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.authorizedPerson.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating authorized person:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji osoby upoważnionej" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an authorized person
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    if (!["PARENT", "HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const { hasAccess, authorizedPerson } = await verifyAccessToAuthorizedPerson(user, id);
    
    if (!authorizedPerson) {
      return NextResponse.json({ error: "Osoba upoważniona nie istnieje" }, { status: 404 });
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
    }

    await prisma.authorizedPerson.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Osoba upoważniona została usunięta" });
  } catch (error) {
    console.error("Error deleting authorized person:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania osoby upoważnionej" },
      { status: 500 }
    );
  }
}

