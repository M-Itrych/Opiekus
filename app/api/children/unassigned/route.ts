import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (
      !payload ||
      (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const children = await prisma.child.findMany({
      where: {
        groupId: null,
      },
      orderBy: {
        surname: "asc",
      },
    });

    return NextResponse.json(children);
  } catch (error) {
    console.error("Error fetching unassigned children:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania nieprzypisanych dzieci" },
      { status: 500 }
    );
  }
}

