import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { Prisma } from "@prisma/client";

interface SessionPayload {
	id: string;
	role: string;
}

async function getAuthUser(): Promise<SessionPayload | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value;
	if (!token) return null;
	return (await verifyToken(token)) as SessionPayload | null;
}

// Cancellation deadline - 8:00 AM on the day of the meal
const CANCELLATION_DEADLINE_HOUR = 8;

function canCancelMeal(mealDate: Date): boolean {
	const now = new Date();
	const deadline = new Date(mealDate);
	deadline.setHours(CANCELLATION_DEADLINE_HOUR, 0, 0, 0);
	return now < deadline;
}

export async function GET(request: Request) {
	try {
		const session = await getAuthUser();

		if (!session) {
			return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const childId = searchParams.get("childId");
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");
		const refunded = searchParams.get("refunded");

		const where: Prisma.MealCancellationWhereInput = {};

		// Parents can only see their own children's cancellations
		if (session.role === "PARENT") {
			const parentChildren = await prisma.child.findMany({
				where: { parentId: session.id },
				select: { id: true }
			});
			const childIds = parentChildren.map(c => c.id);
			
			if (childId && childIds.includes(childId)) {
				where.childId = childId;
			} else {
				where.childId = { in: childIds };
			}
		} else if (childId) {
			where.childId = childId;
		}

		if (startDate) {
			where.date = { ...where.date as Prisma.DateTimeFilter, gte: new Date(startDate) };
		}

		if (endDate) {
			where.date = { ...where.date as Prisma.DateTimeFilter, lte: new Date(endDate) };
		}

		if (refunded !== null && refunded !== undefined) {
			where.refunded = refunded === "true";
		}

		const cancellations = await prisma.mealCancellation.findMany({
			where,
			include: {
				child: {
					select: {
						id: true,
						name: true,
						surname: true,
						group: {
							select: {
								id: true,
								name: true,
								breakfastPrice: true,
								lunchPrice: true,
								snackPrice: true,
							}
						}
					}
				}
			},
			orderBy: { date: "desc" }
		});

		// Calculate value for each cancellation
		const cancellationsWithValue = cancellations.map(c => {
			let mealPrice = 0;
			if (c.child.group) {
				switch (c.mealType) {
					case "BREAKFAST":
						mealPrice = c.child.group.breakfastPrice;
						break;
					case "LUNCH":
						mealPrice = c.child.group.lunchPrice;
						break;
					case "SNACK":
						mealPrice = c.child.group.snackPrice;
						break;
				}
			}
			return {
				...c,
				mealPrice
			};
		});

		return NextResponse.json(cancellationsWithValue);
	} catch (error) {
		console.error("GET /api/menu/cancellations:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const session = await getAuthUser();

		if (!session) {
			return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
		}

		const body = await request.json();
		const { childId, date, mealType, reason } = body;

		if (!childId || !date || !mealType) {
			return NextResponse.json(
				{ error: "Brak wymaganych pól: childId, date, mealType" },
				{ status: 400 }
			);
		}

		// Validate mealType
		if (!["BREAKFAST", "LUNCH", "SNACK"].includes(mealType)) {
			return NextResponse.json(
				{ error: "Nieprawidłowy typ posiłku" },
				{ status: 400 }
			);
		}

		// Check if child exists and belongs to parent (if parent is making the request)
		const child = await prisma.child.findUnique({
			where: { id: childId },
			select: { id: true, parentId: true, groupId: true }
		});

		if (!child) {
			return NextResponse.json({ error: "Dziecko nie istnieje" }, { status: 404 });
		}

		if (session.role === "PARENT" && child.parentId !== session.id) {
			return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
		}

		const mealDate = new Date(date);

		// Check cancellation deadline
		if (!canCancelMeal(mealDate)) {
			return NextResponse.json(
				{ error: `Posiłki można anulować tylko do godziny ${CANCELLATION_DEADLINE_HOUR}:00 w dniu posiłku` },
				{ status: 400 }
			);
		}

		// Check if cancellation already exists
		const existingCancellation = await prisma.mealCancellation.findUnique({
			where: {
				childId_date_mealType: {
					childId,
					date: mealDate,
					mealType
				}
			}
		});

		if (existingCancellation) {
			return NextResponse.json(
				{ error: "Posiłek został już anulowany" },
				{ status: 400 }
			);
		}

		const cancellation = await prisma.mealCancellation.create({
			data: {
				childId,
				date: mealDate,
				mealType,
				reason: reason || null,
			},
			include: {
				child: {
					select: {
						id: true,
						name: true,
						surname: true,
						group: {
							select: {
								id: true,
								name: true,
								breakfastPrice: true,
								lunchPrice: true,
								snackPrice: true,
							}
						}
					}
				}
			}
		});

		return NextResponse.json(cancellation, { status: 201 });
	} catch (error) {
		console.error("POST /api/menu/cancellations:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const session = await getAuthUser();

		if (!session) {
			return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({ error: "Brak ID anulowania" }, { status: 400 });
		}

		const cancellation = await prisma.mealCancellation.findUnique({
			where: { id },
			include: { child: { select: { parentId: true } } }
		});

		if (!cancellation) {
			return NextResponse.json({ error: "Anulowanie nie istnieje" }, { status: 404 });
		}

		// Parents can only delete their own children's cancellations
		if (session.role === "PARENT" && cancellation.child.parentId !== session.id) {
			return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
		}

		// Check if we can still modify (before deadline)
		if (!canCancelMeal(cancellation.date)) {
			return NextResponse.json(
				{ error: "Nie można już cofnąć anulowania posiłku" },
				{ status: 400 }
			);
		}

		await prisma.mealCancellation.delete({
			where: { id }
		});

		return NextResponse.json({ message: "Anulowanie usunięte" });
	} catch (error) {
		console.error("DELETE /api/menu/cancellations:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

