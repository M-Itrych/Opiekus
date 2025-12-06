import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function GET() {
  try {
    const session = await getAuthUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = session.id as string;
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        role: true,
        name: true,
        surname: true,
        email: true,
        children: {
          select: {
            id: true,
            name: true,
            surname: true,
            groupId: true,
          },
        },
        staff: {
          select: {
            groupId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let teacherChildren: Array<{ id: string; name: string; surname: string; groupId: string | null }> = [];

    if (user.role === "TEACHER" && user.staff?.groupId) {
      teacherChildren = await prisma.child.findMany({
        where: { groupId: user.staff.groupId },
        select: {
          id: true,
          name: true,
          surname: true,
          groupId: true,
        },
      });
    }

    return NextResponse.json({
      id: user.id,
      role: user.role,
      name: user.name,
      surname: user.surname,
      email: user.email,
      children:
        user.role === "PARENT"
          ? user.children
          : user.role === "TEACHER"
          ? teacherChildren
          : user.role === "HEADTEACHER"
          ? await prisma.child.findMany({
              select: {
                id: true,
                name: true,
                surname: true,
                groupId: true,
              },
            })
          : [],
    } as {
      id: string;
      role: string;
      name: string;
      surname: string;
      email: string;
      children: Array<{ id: string; name: string; surname: string; groupId: string | null }>;
    });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}