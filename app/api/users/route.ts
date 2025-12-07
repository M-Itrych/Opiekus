import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { UserRole } from "@prisma/client";

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

export async function GET(req: Request) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
		}

		if (user.role !== "HEADTEACHER" && user.role !== "ADMIN") {
			return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
		}

		const { searchParams } = new URL(req.url);
		const role = searchParams.get("role");

		const where: { role?: UserRole } = {};
		if (role && ["ADMIN", "HEADTEACHER", "TEACHER", "PARENT"].includes(role)) {
			where.role = role as UserRole;
		}

		const users = await prisma.user.findMany({
			where,
			select: {
				id: true,
				name: true,
				surname: true,
				email: true,
				role: true,
			},
			orderBy: [
				{ surname: "asc" },
				{ name: "asc" },
			],
		});

		return NextResponse.json(users);
	} catch (error) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ error: "Błąd podczas pobierania użytkowników" },
			{ status: 500 }
		);
	}
}

