import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, type SessionUser } from "@/lib/session";
import { Prisma } from "@prisma/client";

async function getSessionUser(): Promise<SessionUser | null> {
  const payload = await verifySession();
  if (!payload) return null;
  return payload as SessionUser;
}

// GET - List whistleblower reports (restricted to HEADTEACHER/ADMIN)
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    // Only HEADTEACHER and ADMIN can view reports
    if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Prisma.WhistleblowerReportWhereInput = {};

    if (status) {
      where.status = status as "NEW" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
    }

    const reports = await prisma.whistleblowerReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching whistleblower reports:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania zgłoszeń" },
      { status: 500 }
    );
  }
}

// POST - Submit a new whistleblower report (anyone can submit)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, category, isAnonymous, reporterEmail } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Tytuł i treść są wymagane" },
        { status: 400 }
      );
    }

    const report = await prisma.whistleblowerReport.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || null,
        isAnonymous: isAnonymous ?? true,
        reporterEmail: isAnonymous ? null : reporterEmail?.trim() || null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating whistleblower report:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia zgłoszenia" },
      { status: 500 }
    );
  }
}

