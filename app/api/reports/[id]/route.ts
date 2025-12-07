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

function ensureManager(user: SessionUser | null) {
  if (!user) {
    return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  }
  if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const authError = ensureManager(user);
    if (authError) return authError;

    const { id } = await params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Raport nie istnieje" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania raportu" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const authError = ensureManager(user);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { title, content, reportType, periodStart, periodEnd } = body;

    const existing = await prisma.report.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Raport nie istnieje" }, { status: 404 });
    }

    const updateData: {
      title?: string;
      content?: string;
      reportType?: string;
      periodStart?: Date | null;
      periodEnd?: Date | null;
    } = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      updateData.content = content.trim();
    }

    if (reportType !== undefined) {
      updateData.reportType = reportType.trim();
    }

    if (periodStart !== undefined) {
      updateData.periodStart = periodStart ? new Date(periodStart) : null;
    }

    if (periodEnd !== undefined) {
      updateData.periodEnd = periodEnd ? new Date(periodEnd) : null;
    }

    const report = await prisma.report.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji raportu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const authError = ensureManager(user);
    if (authError) return authError;

    const { id } = await params;

    const existing = await prisma.report.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Raport nie istnieje" }, { status: 404 });
    }

    await prisma.report.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania raportu" },
      { status: 500 }
    );
  }
}

