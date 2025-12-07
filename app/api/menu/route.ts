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

export async function GET(request: Request) {
	try {
		const session = await getAuthUser();

		if (!session) {
			return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const month = searchParams.get("month");
		const year = searchParams.get("year");
		const groupId = searchParams.get("groupId");

		let dateFilter = {};
		if (month && year) {
			const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
			const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
			dateFilter = {
				date: {
					gte: startDate,
					lte: endDate,
				},
			};
		}

		const meals = await prisma.mealPlan.findMany({
			where: {
				...dateFilter,
				...(groupId ? { groupId } : {}),
			},
			include: {
				group: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: [{ date: "asc" }, { mealType: "asc" }],
		});

		return NextResponse.json(meals);
	} catch (error) {
		console.error("GET /api/menu:", error);
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
		const { date, mealType, name, description, allergens, groupId } = body;

		if (!date || !mealType || !name) {
			return NextResponse.json(
				{ error: "Data, typ posiłku i nazwa są wymagane" },
				{ status: 400 }
			);
		}

		const meal = await prisma.mealPlan.create({
			data: {
				date: new Date(date),
				mealType,
				name,
				description: description || null,
				allergens: allergens || [],
				groupId: groupId || null,
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

		return NextResponse.json(meal, { status: 201 });
	} catch (error) {
		console.error("POST /api/menu:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

