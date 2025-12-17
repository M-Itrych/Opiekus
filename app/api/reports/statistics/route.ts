import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";

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

        if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
            return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
        }

        // Get current date info
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - 7);

        // Get all groups with children count
        const groups = await prisma.group.findMany({
            include: {
                _count: { select: { children: true, staff: true } },
                room: { select: { name: true } },
            },
        });

        // Children stats
        const totalChildren = await prisma.child.count();
        const childrenWithAllergies = await prisma.child.count({
            where: { allergies: { isEmpty: false } },
        });
        const childrenWithSpecialNeeds = await prisma.child.count({
            where: { specialNeeds: { not: null } },
        });

        // Attendance stats for today
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const todayAttendance = await prisma.attendance.groupBy({
            by: ['status'],
            where: {
                date: { gte: todayStart, lte: todayEnd },
            },
            _count: true,
        });

        const attendanceToday = {
            present: todayAttendance.find(a => a.status === 'PRESENT')?._count || 0,
            absent: todayAttendance.find(a => a.status === 'ABSENT')?._count || 0,
            pending: todayAttendance.find(a => a.status === 'PENDING')?._count || 0,
        };

        // Weekly attendance trend
        const weeklyAttendance = await prisma.attendance.findMany({
            where: {
                date: { gte: startOfWeek, lte: today },
            },
            select: { date: true, status: true },
        });

        // Group by date
        const attendanceByDate: Record<string, { present: number; absent: number; pending: number }> = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            attendanceByDate[dateKey] = { present: 0, absent: 0, pending: 0 };
        }

        for (const att of weeklyAttendance) {
            const dateKey = att.date.toISOString().split('T')[0];
            if (attendanceByDate[dateKey]) {
                if (att.status === 'PRESENT') attendanceByDate[dateKey].present++;
                else if (att.status === 'ABSENT') attendanceByDate[dateKey].absent++;
                else if (att.status === 'PENDING') attendanceByDate[dateKey].pending++;
            }
        }

        // Payment stats
        const paymentStats = await prisma.payment.groupBy({
            by: ['status'],
            where: {
                dueDate: { gte: startOfMonth },
            },
            _sum: { amount: true },
            _count: true,
        });

        const payments = {
            pending: { count: 0, amount: 0 },
            paid: { count: 0, amount: 0 },
            overdue: { count: 0, amount: 0 },
        };

        for (const stat of paymentStats) {
            const key = stat.status.toLowerCase() as keyof typeof payments;
            if (payments[key]) {
                payments[key] = {
                    count: stat._count,
                    amount: stat._sum.amount || 0,
                };
            }
        }

        // Consent stats
        const consentStats = await prisma.consent.groupBy({
            by: ['status'],
            _count: true,
        });

        const consents = {
            accepted: consentStats.find(c => c.status === 'ACCEPTED')?._count || 0,
            pending: consentStats.find(c => c.status === 'PENDING')?._count || 0,
            rejected: consentStats.find(c => c.status === 'REJECTED')?._count || 0,
        };

        // Staff count
        const staffCount = await prisma.staff.count();

        // Diet breakdown
        const dietStats = await prisma.child.groupBy({
            by: ['diet'],
            _count: true,
        });

        const diets: Record<string, number> = {};
        for (const stat of dietStats) {
            diets[stat.diet] = stat._count;
        }

        return NextResponse.json({
            overview: {
                totalChildren,
                childrenWithAllergies,
                childrenWithSpecialNeeds,
                staffCount,
                groupsCount: groups.length,
            },
            groups: groups.map(g => ({
                id: g.id,
                name: g.name,
                ageRange: g.ageRange,
                childrenCount: g._count.children,
                maxCapacity: g.maxCapacity,
                staffCount: g._count.staff,
                room: g.room?.name || null,
                fillRate: ((g._count.children / g.maxCapacity) * 100).toFixed(1),
            })),
            attendance: {
                today: attendanceToday,
                weekly: Object.entries(attendanceByDate).map(([date, stats]) => ({
                    date,
                    ...stats,
                })),
            },
            payments,
            consents,
            diets,
        });
    } catch (error) {
        console.error("Error fetching statistics:", error);
        return NextResponse.json(
            { error: "Błąd podczas pobierania statystyk" },
            { status: 500 }
        );
    }
}
