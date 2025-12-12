import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma, DocumentStatus } from "@prisma/client";

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

function normalizeStatus(value: unknown): DocumentStatus | null {
	if (!value || typeof value !== "string") return null;
	const upper = value.toUpperCase();
	return Object.values(DocumentStatus).includes(upper as DocumentStatus)
		? (upper as DocumentStatus)
		: null;
}

function ensureManager(user: SessionUser | null) {
	if (!user) {
		return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
	}
	if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
		return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
	}
	return null;
}

export async function GET(req: Request) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const status = searchParams.get("status");
		const search = searchParams.get("search");

		const where: Prisma.DocumentWhereInput = {};

		const normalizedStatus = normalizeStatus(status);
		if (normalizedStatus) {
			where.status = normalizedStatus;
		}

		if (search) {
			where.AND = [
				{
					OR: [
						{ title: { contains: search, mode: "insensitive" } },
						{ description: { contains: search, mode: "insensitive" } },
					],
				},
			];
		}

		const documents = await prisma.document.findMany({
			where,
			orderBy: { createdAt: "desc" },
			include: {
				groups: {
					include: {
						group: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		});

		return NextResponse.json(documents);
	} catch (error) {
		console.error("Error fetching documents:", error);
		return NextResponse.json(
			{ error: "Błąd podczas pobierania dokumentów" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		const authError = ensureManager(user);
		if (authError) return authError;

		const body = await request.json();
		const { title, description, fileUrl, status, groupIds } = body;

		const trimmedTitle = title?.trim();
		const trimmedFileUrl = fileUrl?.trim();

		if (!trimmedTitle || !trimmedFileUrl) {
			return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
		}

		const normalizedStatus = normalizeStatus(status) ?? DocumentStatus.AKTYWNY;

		const groupIdsArray = Array.isArray(groupIds) ? groupIds.filter((id: unknown) => typeof id === "string" && id.trim()) : [];

		const document = await prisma.document.create({
			data: {
				title: trimmedTitle,
				description: description?.trim() || null,
				fileUrl: trimmedFileUrl,
				status: normalizedStatus,
			},
			include: {
				groups: {
					include: {
						group: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		});

		if (groupIdsArray.length > 0) {
			await prisma.documentGroup.createMany({
				data: groupIdsArray.map((groupId: string) => ({
					documentId: document.id,
					groupId: groupId.trim(),
				})),
			});

			const documentWithGroups = await prisma.document.findUnique({
				where: { id: document.id },
				include: {
					groups: {
						include: {
							group: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			});

			return NextResponse.json(documentWithGroups, { status: 201 });
		}

		return NextResponse.json(document, { status: 201 });
	} catch (error) {
		console.error("Error creating document:", error);
		return NextResponse.json(
			{ error: "Błąd podczas tworzenia dokumentu" },
			{ status: 500 }
		);
	}
}
