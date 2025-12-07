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

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getAuthUser();

		if (!session) {
			return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
		}

		const { id } = await params;

		const document = await prisma.document.findUnique({
			where: { id },
		});

		if (!document) {
			return NextResponse.json({ error: "Dokument nie znaleziony" }, { status: 404 });
		}

		return NextResponse.json(document);
	} catch (error) {
		console.error("GET /api/documents/[id]:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getAuthUser();

		if (!session) {
			return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
		}

		const payload = session as unknown as { role: string };
		if (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN") {
			return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
		}

		const { id } = await params;
		const body = await request.json();
		const { title, description, fileUrl, status } = body;

		const existingDocument = await prisma.document.findUnique({
			where: { id },
		});

		if (!existingDocument) {
			return NextResponse.json({ error: "Dokument nie znaleziony" }, { status: 404 });
		}

		const document = await prisma.document.update({
			where: { id },
			data: {
				...(title && { title }),
				...(description !== undefined && { description }),
				...(fileUrl && { fileUrl }),
				...(status && { status }),
			},
		});

		return NextResponse.json(document);
	} catch (error) {
		console.error("PUT /api/documents/[id]:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getAuthUser();

		if (!session) {
			return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
		}

		const payload = session as unknown as { role: string };
		if (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN") {
			return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
		}

		const { id } = await params;

		await prisma.document.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("DELETE /api/documents/[id]:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

