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

		const meal = await prisma.mealPlan.findUnique({
			where: { id },
			include: {
				group: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!meal) {
			return NextResponse.json({ error: "Posiłek nie znaleziony" }, { status: 404 });
		}

		return NextResponse.json(meal);
	} catch (error) {
		console.error("GET /api/menu/[id]:", error);
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
		const { date, mealType, name, description, allergens, groupId } = body;

		const existingMeal = await prisma.mealPlan.findUnique({
			where: { id },
		});

		if (!existingMeal) {
			return NextResponse.json({ error: "Posiłek nie znaleziony" }, { status: 404 });
		}

		const meal = await prisma.mealPlan.update({
			where: { id },
			data: {
				...(date && { date: new Date(date) }),
				...(mealType && { mealType }),
				...(name && { name }),
				...(description !== undefined && { description }),
				...(allergens && { allergens }),
				...(groupId !== undefined && { groupId }),
			},
			include: {
				group: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		return NextResponse.json(meal);
	} catch (error) {
		console.error("PUT /api/menu/[id]:", error);
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

		await prisma.mealPlan.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("DELETE /api/menu/[id]:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

