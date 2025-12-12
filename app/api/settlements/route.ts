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

function ensureManager(session: SessionPayload | null) {
	if (!session) {
		return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
	}
	if (session.role !== "HEADTEACHER" && session.role !== "ADMIN") {
		return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
	}
	return null;
}

interface ChildSettlement {
	childId: string;
	childName: string;
	childSurname: string;
	groupId: string | null;
	groupName: string | null;
	cancellations: {
		id: string;
		date: Date;
		mealType: string;
		mealPrice: number;
		refunded: boolean;
	}[];
	totalUnrefunded: number;
	totalRefunded: number;
}

export async function GET(request: Request) {
	try {
		const session = await getAuthUser();
		const authError = ensureManager(session);
		if (authError) return authError;

		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");
		const groupId = searchParams.get("groupId");
		const childId = searchParams.get("childId");
		const onlyUnrefunded = searchParams.get("onlyUnrefunded") === "true";

		const where: Prisma.MealCancellationWhereInput = {};

		if (startDate) {
			where.date = { ...where.date as Prisma.DateTimeFilter, gte: new Date(startDate) };
		}

		if (endDate) {
			where.date = { ...where.date as Prisma.DateTimeFilter, lte: new Date(endDate) };
		}

		if (childId) {
			where.childId = childId;
		}

		if (groupId) {
			where.child = { groupId };
		}

		if (onlyUnrefunded) {
			where.refunded = false;
		}

		const cancellations = await prisma.mealCancellation.findMany({
			where,
			include: {
				child: {
					select: {
						id: true,
						name: true,
						surname: true,
						groupId: true,
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
			orderBy: [{ child: { surname: "asc" } }, { date: "desc" }]
		});

		// Group by child and calculate totals
		const settlementsByChild = new Map<string, ChildSettlement>();

		for (const c of cancellations) {
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

			const existing = settlementsByChild.get(c.childId);
			if (existing) {
				existing.cancellations.push({
					id: c.id,
					date: c.date,
					mealType: c.mealType,
					mealPrice,
					refunded: c.refunded,
				});
				if (c.refunded) {
					existing.totalRefunded += mealPrice;
				} else {
					existing.totalUnrefunded += mealPrice;
				}
			} else {
				settlementsByChild.set(c.childId, {
					childId: c.childId,
					childName: c.child.name,
					childSurname: c.child.surname,
					groupId: c.child.groupId,
					groupName: c.child.group?.name || null,
					cancellations: [{
						id: c.id,
						date: c.date,
						mealType: c.mealType,
						mealPrice,
						refunded: c.refunded,
					}],
					totalUnrefunded: c.refunded ? 0 : mealPrice,
					totalRefunded: c.refunded ? mealPrice : 0,
				});
			}
		}

		const settlements = Array.from(settlementsByChild.values());
		const grandTotalUnrefunded = settlements.reduce((sum, s) => sum + s.totalUnrefunded, 0);
		const grandTotalRefunded = settlements.reduce((sum, s) => sum + s.totalRefunded, 0);

		return NextResponse.json({
			settlements,
			summary: {
				totalChildren: settlements.length,
				totalCancellations: cancellations.length,
				grandTotalUnrefunded,
				grandTotalRefunded,
			}
		});
	} catch (error) {
		console.error("GET /api/settlements:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

// Mark cancellations as refunded
export async function POST(request: Request) {
	try {
		const session = await getAuthUser();
		const authError = ensureManager(session);
		if (authError) return authError;

		const body = await request.json();
		const { cancellationIds, action } = body;

		if (!cancellationIds || !Array.isArray(cancellationIds) || cancellationIds.length === 0) {
			return NextResponse.json(
				{ error: "Brak ID anulowań do przetworzenia" },
				{ status: 400 }
			);
		}

		if (action === "refund") {
			// Mark as refunded
			const result = await prisma.mealCancellation.updateMany({
				where: { id: { in: cancellationIds } },
				data: { refunded: true }
			});

			return NextResponse.json({
				message: `Oznaczono ${result.count} anulowań jako zwrócone`,
				count: result.count
			});
		} else if (action === "generate_payment") {
			// Get cancellations and create negative payment records
			const cancellations = await prisma.mealCancellation.findMany({
				where: {
					id: { in: cancellationIds },
					refunded: false
				},
				include: {
					child: {
						select: {
							id: true,
							name: true,
							surname: true,
							group: {
								select: {
									breakfastPrice: true,
									lunchPrice: true,
									snackPrice: true,
								}
							}
						}
					}
				}
			});

			// Group by child and calculate total refund
			const refundsByChild = new Map<string, { childId: string; total: number; cancellationIds: string[] }>();

			for (const c of cancellations) {
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

				const existing = refundsByChild.get(c.childId);
				if (existing) {
					existing.total += mealPrice;
					existing.cancellationIds.push(c.id);
				} else {
					refundsByChild.set(c.childId, {
						childId: c.childId,
						total: mealPrice,
						cancellationIds: [c.id]
					});
				}
			}

			// Create negative payment records and mark cancellations as refunded
			const payments = [];
			for (const refund of refundsByChild.values()) {
				if (refund.total > 0) {
					const payment = await prisma.payment.create({
						data: {
							childId: refund.childId,
							amount: -refund.total,
							description: `Zwrot za anulowane posiłki (${refund.cancellationIds.length} szt.)`,
							dueDate: new Date(),
							status: "PAID",
							paidDate: new Date(),
						}
					});
					payments.push(payment);

					// Mark cancellations as refunded
					await prisma.mealCancellation.updateMany({
						where: { id: { in: refund.cancellationIds } },
						data: { refunded: true }
					});
				}
			}

			return NextResponse.json({
				message: `Utworzono ${payments.length} zwrotów`,
				payments
			});
		}

		return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
	} catch (error) {
		console.error("POST /api/settlements:", error);
		return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
	}
}

