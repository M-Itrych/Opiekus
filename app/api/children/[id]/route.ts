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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeParam = searchParams.get("include");
    const includes = includeParam ? includeParam.split(",") : [];

    // Build dynamic include object based on query params
    const includeConfig: Record<string, unknown> = {
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
          ageRange: true,
        },
      },
      attendances: {
        orderBy: { date: "desc" },
        take: 10,
      },
      consents: true,
      pickupRecords: {
        orderBy: { pickupDate: "desc" },
        take: 5,
      },
    };

    // Optional includes for medical/behavioral data
    if (includes.includes("medicalDocuments")) {
      includeConfig.medicalDocuments = {
        orderBy: { uploadDate: "desc" },
      };
    }

    if (includes.includes("chronicDiseases")) {
      includeConfig.chronicDiseases = {
        orderBy: { createdAt: "desc" },
      };
    }

    if (includes.includes("medications")) {
      includeConfig.medications = {
        orderBy: { createdAt: "desc" },
      };
    }

    if (includes.includes("recommendations")) {
      includeConfig.recommendations = {
        orderBy: { date: "desc" },
        include: {
          author: {
            select: { id: true, name: true, surname: true },
          },
        },
      };
    }

    if (includes.includes("behavioralInfos")) {
      includeConfig.behavioralInfos = {
        orderBy: { date: "desc" },
        include: {
          author: {
            select: { id: true, name: true, surname: true },
          },
        },
      };
    }

    // Include all medical data at once
    if (includes.includes("medical")) {
      includeConfig.medicalDocuments = {
        orderBy: { uploadDate: "desc" },
      };
      includeConfig.chronicDiseases = {
        orderBy: { createdAt: "desc" },
      };
      includeConfig.medications = {
        orderBy: { createdAt: "desc" },
      };
      includeConfig.recommendations = {
        orderBy: { date: "desc" },
        include: {
          author: {
            select: { id: true, name: true, surname: true },
          },
        },
      };
      includeConfig.behavioralInfos = {
        orderBy: { date: "desc" },
        include: {
          author: {
            select: { id: true, name: true, surname: true },
          },
        },
      };
    }

    const child = await prisma.child.findUnique({
      where: { id },
      include: includeConfig,
    });

    if (!child) {
      return NextResponse.json(
        { error: "Nie znaleziono dziecka" },
        { status: 404 }
      );
    }

    if (user.role === "PARENT" && child.parentId !== user.id) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    if (user.role === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
        select: { groupId: true },
      });

      if (!staff?.groupId || staff.groupId !== child.groupId) {
        return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
      }
    }

    return NextResponse.json(child);
  } catch (error) {
    console.error("Error fetching child:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania danych dziecka" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const { id } = await params;

    const existingChild = await prisma.child.findUnique({
      where: { id },
      select: { parentId: true },
    });

    if (!existingChild) {
      return NextResponse.json(
        { error: "Nie znaleziono dziecka" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      name,
      surname,
      age,
      groupId, 
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

    // Walidacja PESEL jeśli podany
    if (pesel !== undefined && pesel !== null && pesel !== '' && !validatePesel(pesel)) {
      return NextResponse.json(
        { error: "Nieprawidłowy numer PESEL" },
        { status: 400 }
      );
    }

    // Sprawdź czy PESEL nie jest już używany przez inne dziecko
    if (pesel) {
      const existingChildWithPesel = await prisma.child.findUnique({
        where: { pesel },
        select: { id: true },
      });
      if (existingChildWithPesel && existingChildWithPesel.id !== id) {
        return NextResponse.json(
          { error: "Dziecko z tym numerem PESEL już istnieje w systemie" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    // Oblicz wiek z daty urodzenia jeśli podana
    if (birthDate !== undefined) {
      if (birthDate) {
        const parsedBirthDate = new Date(birthDate);
        if (!isNaN(parsedBirthDate.getTime())) {
          updateData.birthDate = parsedBirthDate;
          updateData.age = calculateAge(parsedBirthDate);
        }
      } else {
        updateData.birthDate = null;
      }
    }

    if (payload.role === "PARENT") {
      if (existingChild.parentId !== payload.id) {
        return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
      }

      if (name !== undefined) updateData.name = name.trim();
      if (surname !== undefined) updateData.surname = surname.trim();
      if (age !== undefined && birthDate === undefined) updateData.age = parseInt(age);
      if (hasImageConsent !== undefined) updateData.hasImageConsent = hasImageConsent;
      if (hasDataConsent !== undefined) updateData.hasDataConsent = hasDataConsent;
      if (allergies !== undefined) updateData.allergies = allergies;
      if (specialNeeds !== undefined) updateData.specialNeeds = specialNeeds || null;
      if (pesel !== undefined) updateData.pesel = pesel?.trim() || null;
      if (address !== undefined) updateData.address = address?.trim() || null;
      if (city !== undefined) updateData.city = city?.trim() || null;
      if (postalCode !== undefined) updateData.postalCode = postalCode ? formatPostalCode(postalCode.trim()) : null;
    } else if (payload.role === "HEADTEACHER" || payload.role === "ADMIN") {
      if (name !== undefined) updateData.name = name.trim();
      if (surname !== undefined) updateData.surname = surname.trim();
      if (age !== undefined && birthDate === undefined) updateData.age = parseInt(age);
      if (groupId !== undefined) updateData.groupId = groupId === "null" ? null : groupId;
      if (hasImageConsent !== undefined) updateData.hasImageConsent = hasImageConsent;
      if (hasDataConsent !== undefined) updateData.hasDataConsent = hasDataConsent;
      if (allergies !== undefined) updateData.allergies = allergies;
      if (specialNeeds !== undefined) updateData.specialNeeds = specialNeeds || null;
      if (pesel !== undefined) updateData.pesel = pesel?.trim() || null;
      if (address !== undefined) updateData.address = address?.trim() || null;
      if (city !== undefined) updateData.city = city?.trim() || null;
      if (postalCode !== undefined) updateData.postalCode = postalCode ? formatPostalCode(postalCode.trim()) : null;
    } else {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const updatedChild = await prisma.child.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedChild);
  } catch (error) {
    console.error("Error updating child:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji danych dziecka" },
      { status: 500 }
    );
  }
}

