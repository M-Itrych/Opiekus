import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { groupId } = body;

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        groupId: groupId === "null" ? null : groupId,
      },
    });

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error("Error updating staff group:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji grupy pracownika" },
      { status: 500 }
    );
  }
}

