import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma } from "@prisma/client";

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

    // Only managers can access reports
    if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("reportType");
    const authorId = searchParams.get("authorId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Prisma.ReportWhereInput = {};

    // Filter by report type
    if (reportType) {
      where.reportType = reportType;
    }

    // Filter by author
    if (authorId) {
      where.authorId = authorId;
    }

    // Filter by period
    if (startDate || endDate) {
      if (startDate) {
        where.periodStart = { gte: new Date(startDate) };
      }
      if (endDate) {
        where.periodEnd = { lte: new Date(endDate) };
      }
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania raportów" },
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
    const { title, content, reportType, periodStart, periodEnd } = body;

    if (!title || !content || !reportType) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const parsedPeriodStart = periodStart ? new Date(periodStart) : null;
    const parsedPeriodEnd = periodEnd ? new Date(periodEnd) : null;

    if (periodStart && Number.isNaN(parsedPeriodStart?.getTime())) {
      return NextResponse.json({ error: "Nieprawidłowa data początkowa" }, { status: 400 });
    }

    if (periodEnd && Number.isNaN(parsedPeriodEnd?.getTime())) {
      return NextResponse.json({ error: "Nieprawidłowa data końcowa" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        authorId: user!.id,
        title: title.trim(),
        content: content.trim(),
        reportType: reportType.trim(),
        periodStart: parsedPeriodStart,
        periodEnd: parsedPeriodEnd,
      },
      include: {
        author: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia raportu" },
      { status: 500 }
    );
  }
}

