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
			return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
		}

		const documents = await prisma.document.findMany({
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(documents);
	} catch (error) {
		console.error("GET /api/documents:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const session = await getAuthUser();

		if (!session) {
			return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
		}

		const payload = session as unknown as { role: string };
		if (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN") {
			return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
		}

		const body = await request.json();
		const { title, description, fileUrl, status } = body;

		if (!title || !fileUrl) {
			return NextResponse.json(
				{ error: "Tytuł i plik są wymagane" },
				{ status: 400 }
			);
		}

		const document = await prisma.document.create({
			data: {
				title,
				description: description || null,
				fileUrl,
				status: status || "AKTYWNY",
			},
		});

		return NextResponse.json(document, { status: 201 });
	} catch (error) {
		console.error("POST /api/documents:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

