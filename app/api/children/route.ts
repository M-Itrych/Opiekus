import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { validatePesel, calculateAge, formatPostalCode } from "@/lib/utils";

interface SessionPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  surname: string;
}

async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return payload as unknown as SessionPayload;
}

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const parentId = searchParams.get("parentId");

    const whereClause: Record<string, unknown> = {};

    if (user.role === "PARENT") {
      whereClause.parentId = user.id;
    } else if (user.role === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
        select: { groupId: true },
      });

      if (!staff?.groupId) {
        return NextResponse.json(
          { error: "Brak przypisanej grupy" },
          { status: 400 }
        );
      }
      whereClause.groupId = staff.groupId;
    } else if (user.role === "HEADTEACHER" || user.role === "ADMIN") {
      if (groupId) {
        whereClause.groupId = groupId === "null" ? null : groupId;
      }
      if (parentId) {
        whereClause.parentId = parentId;
      }
    } else {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const children = await prisma.child.findMany({
      where: whereClause,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ surname: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(children);
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania dzieci" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    if (user.role !== "PARENT" && user.role !== "HEADTEACHER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      surname,
      age,
      hasImageConsent,
      hasDataConsent,
      allergies,
      specialNeeds,
      pesel,
      birthDate,
      address,
      city,
      postalCode,
    } = body;
    let { parentId, groupId } = body;

    if (user.role === "PARENT") {
      parentId = user.id;
      groupId = null;
    }

    // Walidacja PESEL jeśli podany
    if (pesel && !validatePesel(pesel)) {
      return NextResponse.json(
        { error: "Nieprawidłowy numer PESEL" },
        { status: 400 }
      );
    }

    // Sprawdź czy PESEL nie jest już używany
    if (pesel) {
      const existingChild = await prisma.child.findUnique({
        where: { pesel },
        select: { id: true },
      });
      if (existingChild) {
        return NextResponse.json(
          { error: "Dziecko z tym numerem PESEL już istnieje w systemie" },
          { status: 400 }
        );
      }
    }

    // Oblicz wiek z daty urodzenia lub użyj podanego wieku
    let calculatedAge = age !== undefined ? parseInt(age) : 0;
    if (birthDate) {
      const parsedBirthDate = new Date(birthDate);
      if (!isNaN(parsedBirthDate.getTime())) {
        calculatedAge = calculateAge(parsedBirthDate);
      }
    }

    if (!name || !surname || (age === undefined && !birthDate) || !parentId) {
      return NextResponse.json(
        { error: "Imię, nazwisko i data urodzenia (lub wiek) są wymagane" },
        { status: 400 }
      );
    }

    if (user.role !== "PARENT") {
      const parent = await prisma.user.findUnique({
        where: { id: parentId },
        select: { id: true, role: true },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Nie znaleziono rodzica o podanym ID" },
          { status: 400 }
        );
      }

      if (parent.role !== "PARENT") {
        return NextResponse.json(
          { error: "Podany użytkownik nie jest rodzicem" },
          { status: 400 }
        );
      }
    }

    if (groupId && (user.role === "HEADTEACHER" || user.role === "ADMIN")) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { id: true },
      });

      if (!group) {
        return NextResponse.json(
          { error: "Nie znaleziono grupy o podanym ID" },
          { status: 400 }
        );
      }
    }

    const child = await prisma.child.create({
      data: {
        name: name.trim(),
        surname: surname.trim(),
        age: calculatedAge,
        parentId,
        groupId: groupId || null,
        hasImageConsent: hasImageConsent ?? false,
        hasDataConsent: hasDataConsent ?? false,
        allergies: allergies || [],
        specialNeeds: specialNeeds || null,
        pesel: pesel?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        postalCode: postalCode ? formatPostalCode(postalCode.trim()) : null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(child, { status: 201 });
  } catch (error) {
    console.error("Error creating child:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia dziecka" },
      { status: 500 }
    );
  }
}

