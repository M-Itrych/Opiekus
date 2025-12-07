import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";

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

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    // Teachers can only see children in their assigned group
    if (user.role === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
        select: { groupId: true },
      });

      if (!staff?.groupId) {
        return NextResponse.json({ error: "Brak przypisanej grupy" }, { status: 400 });
      }

      const children = await prisma.child.findMany({
        where: { groupId: staff.groupId },
        select: {
          id: true,
          name: true,
          surname: true,
          age: true,
          groupId: true,
          hasImageConsent: true,
          hasDataConsent: true,
          allergies: true,
          specialNeeds: true,
          parent: {
            select: {
              id: true,
              name: true,
              surname: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: [{ surname: "asc" }, { name: "asc" }],
      });

      return NextResponse.json(children);
    }

    // HeadTeacher and Admin can see all children
    if (user.role === "HEADTEACHER" || user.role === "ADMIN") {
      const children = await prisma.child.findMany({
        select: {
          id: true,
          name: true,
          surname: true,
          age: true,
          groupId: true,
          hasImageConsent: true,
          hasDataConsent: true,
          allergies: true,
          specialNeeds: true,
          parent: {
            select: {
              id: true,
              name: true,
              surname: true,
              phone: true,
              email: true,
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
    }

    // Parents can see only their children
    if (user.role === "PARENT") {
      const children = await prisma.child.findMany({
        where: { parentId: user.id },
        select: {
          id: true,
          name: true,
          surname: true,
          age: true,
          groupId: true,
          hasImageConsent: true,
          hasDataConsent: true,
          allergies: true,
          specialNeeds: true,
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
    }

    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania dzieci" },
      { status: 500 }
    );
  }
}

