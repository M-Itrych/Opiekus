import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { getOrCreateDailyPickupCode } from "@/lib/pickup-code";

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

        if (user.role !== "PARENT") {
            return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
        }

        const children = await prisma.child.findMany({
            where: { parentId: user.id },
            select: { id: true, name: true, surname: true },
        });

        if (children.length === 0) {
            return NextResponse.json({ error: "Brak przypisanych dzieci" }, { status: 404 });
        }

        const codesWithChildren = await Promise.all(
            children.map(async (child) => {
                const code = await getOrCreateDailyPickupCode(child.id);
                return {
                    childId: child.id,
                    childName: `${child.name} ${child.surname}`,
                    code,
                };
            })
        );

        return NextResponse.json(codesWithChildren);
    } catch (error) {
        console.error("Error fetching pickup code:", error);
        return NextResponse.json(
            { error: "Błąd podczas pobierania kodu odbioru" },
            { status: 500 }
        );
    }
}
