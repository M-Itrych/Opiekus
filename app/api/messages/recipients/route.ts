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

        if (user.role === "PARENT") {
            const children = await prisma.child.findMany({
                where: { parentId: user.id },
                select: { groupId: true },
            });

            const groupIds = children
                .map((c) => c.groupId)
                .filter((id): id is string => id !== null);

            const teachers = await prisma.user.findMany({
                where: {
                    role: "TEACHER",
                    staff: {
                        groupId: { in: groupIds.length > 0 ? groupIds : undefined },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                    role: true,
                },
            });

            const headteachers = await prisma.user.findMany({
                where: {
                    role: { in: ["HEADTEACHER", "ADMIN"] },
                },
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                    role: true,
                },
            });

            const recipients = [
                ...headteachers.map((u) => ({
                    ...u,
                    category: "Dyrekcja",
                })),
                ...teachers.map((u) => ({
                    ...u,
                    category: "Nauczyciele",
                })),
            ];

            return NextResponse.json(recipients);
        }

        if (user.role === "TEACHER") {
            const staff = await prisma.staff.findUnique({
                where: { userId: user.id },
                select: { groupId: true },
            });

            const parents = await prisma.user.findMany({
                where: {
                    role: "PARENT",
                    children: staff?.groupId
                        ? { some: { groupId: staff.groupId } }
                        : undefined,
                },
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                    role: true,
                },
            });

            const headteachers = await prisma.user.findMany({
                where: {
                    role: { in: ["HEADTEACHER", "ADMIN"] },
                },
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                    role: true,
                },
            });

            const recipients = [
                ...headteachers.map((u) => ({
                    ...u,
                    category: "Dyrekcja",
                })),
                ...parents.map((u) => ({
                    ...u,
                    category: "Rodzice",
                })),
            ];

            return NextResponse.json(recipients);
        }

        if (user.role === "HEADTEACHER" || user.role === "ADMIN") {
            const allUsers = await prisma.user.findMany({
                where: {
                    id: { not: user.id },
                },
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                    role: true,
                },
            });

            const recipients = allUsers.map((u) => ({
                ...u,
                category:
                    u.role === "PARENT"
                        ? "Rodzice"
                        : u.role === "TEACHER"
                            ? "Nauczyciele"
                            : "Dyrekcja",
            }));

            return NextResponse.json(recipients);
        }

        return NextResponse.json([]);
    } catch (error) {
        console.error("Error fetching recipients:", error);
        return NextResponse.json(
            { error: "Błąd podczas pobierania odbiorców" },
            { status: 500 }
        );
    }
}
