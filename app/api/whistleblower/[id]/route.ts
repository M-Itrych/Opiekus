import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, type SessionUser } from "@/lib/session";
import { WhistleblowerStatus } from "@prisma/client";

async function getSessionUser(): Promise<SessionUser | null> {
  const payload = await verifySession();
  if (!payload) return null;
  return payload as SessionUser;
}

// GET - Get a specific report
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const report = await prisma.whistleblowerReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Zgłoszenie nie istnieje" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching whistleblower report:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania zgłoszenia" },
      { status: 500 }
    );
  }
}

// PATCH - Update report status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, resolution } = body;

    const existingReport = await prisma.whistleblowerReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Zgłoszenie nie istnieje" }, { status: 404 });
    }

    const updateData: { status?: WhistleblowerStatus; resolution?: string | null } = {};

    if (status) {
      const validStatuses = Object.values(WhistleblowerStatus);
      if (!validStatuses.includes(status as WhistleblowerStatus)) {
        return NextResponse.json({ error: "Nieprawidłowy status" }, { status: 400 });
      }
      updateData.status = status as WhistleblowerStatus;
    }

    if (resolution !== undefined) {
      updateData.resolution = resolution?.trim() || null;
    }

    const report = await prisma.whistleblowerReport.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error updating whistleblower report:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji zgłoszenia" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a report
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const existingReport = await prisma.whistleblowerReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Zgłoszenie nie istnieje" }, { status: 404 });
    }

    await prisma.whistleblowerReport.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Zgłoszenie zostało usunięte" });
  } catch (error) {
    console.error("Error deleting whistleblower report:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania zgłoszenia" },
      { status: 500 }
    );
  }
}

