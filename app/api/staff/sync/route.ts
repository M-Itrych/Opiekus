import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { UserRole, StaffRole } from "@prisma/client";

// Map UserRole to StaffRole (only TEACHER should be in Staff)
const USER_ROLE_TO_STAFF_ROLE: Partial<Record<UserRole, StaffRole>> = {
	TEACHER: "NAUCZYCIEL",
};

async function authorize() {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value;

	if (!token) {
		return { error: NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 }) };
	}

	const payload = await verifyToken(token);

	if (!payload || (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")) {
		return { error: NextResponse.json({ error: "Brak uprawnień" }, { status: 403 }) };
	}

	return { payload };
}

export async function POST() {
	try {
		const { error } = await authorize();
		if (error) return error;

		// Find users with TEACHER role without Staff entry
		const usersWithoutStaff = await prisma.user.findMany({
			where: {
				role: "TEACHER",
				staff: null,
			},
			select: {
				id: true,
				role: true,
			},
		});

		if (usersWithoutStaff.length === 0) {
			return NextResponse.json({ 
				message: "Wszyscy użytkownicy są zsynchronizowani",
				synced: 0 
			});
		}

		// Create Staff entries for users without one
		const createPromises = usersWithoutStaff.map((user) => {
			const staffRole = USER_ROLE_TO_STAFF_ROLE[user.role];
			if (!staffRole) return null;

			return prisma.staff.create({
				data: {
					userId: user.id,
					staffRole: staffRole,
					permissions: [],
					groupId: null,
				},
			});
		});

		const results = await Promise.all(createPromises.filter(Boolean));

		return NextResponse.json({
			message: `Zsynchronizowano ${results.length} użytkowników`,
			synced: results.length,
		});
	} catch (err) {
		console.error("Error syncing staff:", err);
		return NextResponse.json(
			{ error: "Błąd podczas synchronizacji" },
			{ status: 500 }
		);
	}
}

