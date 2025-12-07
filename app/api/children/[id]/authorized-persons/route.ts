import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, type SessionUser } from "@/lib/session";

async function getSessionUser(): Promise<SessionUser | null> {
  const payload = await verifySession();
  if (!payload) return null;
  return payload as SessionUser;
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { id: childId } = await params;

    const hasAccess = await verifyAccessToChild(user, childId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego dziecka" }, { status: 403 });
    }

    const authorizedPersons = await prisma.authorizedPerson.findMany({
      where: { childId, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(authorizedPersons);
  } catch (error) {
    console.error("Error fetching authorized persons:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania osób upoważnionych" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { id: childId } = await params;

    if (!["PARENT", "HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const hasAccess = await verifyAccessToChild(user, childId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Brak dostępu do tego dziecka" }, { status: 403 });
    }

    const body = await request.json();
    const { name, surname, relation, phone, idNumber } = body;

    if (!name || !surname || !relation) {
      return NextResponse.json(
        { error: "Imię, nazwisko i relacja są wymagane" },
        { status: 400 }
      );
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return NextResponse.json({ error: "Dziecko nie istnieje" }, { status: 404 });
    }

    const authorizedPerson = await prisma.authorizedPerson.create({
      data: {
        childId,
        name: name.trim(),
        surname: surname.trim(),
        relation: relation.trim(),
        phone: phone?.trim() || null,
        idNumber: idNumber?.trim() || null,
      },
    });

    return NextResponse.json(authorizedPerson, { status: 201 });
  } catch (error) {
    console.error("Error creating authorized person:", error);
    return NextResponse.json(
      { error: "Błąd podczas dodawania osoby upoważnionej" },
      { status: 500 }
    );
  }
}

