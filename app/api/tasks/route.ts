import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma, TaskStatus, TaskCategory } from "@prisma/client";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

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

function normalizeStatus(value: unknown): TaskStatus | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return Object.values(TaskStatus).includes(upper as TaskStatus) ? (upper as TaskStatus) : null;
}

function normalizeCategory(value: unknown): TaskCategory | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return Object.values(TaskCategory).includes(upper as TaskCategory)
    ? (upper as TaskCategory)
    : null;
}

function normalizePriority(value: unknown): TaskPriority | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.toUpperCase();
  const validPriorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];
  return validPriorities.includes(upper as TaskPriority) ? (upper as TaskPriority) : null;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const where: Prisma.TaskWhereInput =
      user.role === "HEADTEACHER" || user.role === "ADMIN"
        ? {}
        : { assignedToId: user.id };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        assignedTo: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Błąd podczas pobierania zadań" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const authError = ensureManager(user);
    if (authError) return authError;

    const body = await request.json();
    const {
      title,
      description,
      dueDate,
      assignedToId,
      priority,
      status,
      category,
    } = body;

    if (!title || !description || !dueDate || !assignedToId) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const normalizedPriority = normalizePriority(priority) ?? "MEDIUM";
    const normalizedStatus = normalizeStatus(status) ?? TaskStatus.TODO;
    const normalizedCategory = normalizeCategory(category) ?? TaskCategory.ADMINISTRACYJNE;
    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return NextResponse.json({ error: "Nieprawidłowa data" }, { status: 400 });
    }

    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true },
    });

    if (!assignedUser) {
      return NextResponse.json(
        { error: "Wybrany pracownik nie istnieje" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        dueDate: parsedDueDate,
        assignedToId,
        priority: normalizedPriority,
        status: normalizedStatus,
        category: normalizedCategory,
      } as any,
      include: {
        assignedTo: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Wybrany pracownik nie istnieje. Wybierz innego pracownika." },
          { status: 400 }
        );
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Zadanie o takich parametrach już istnieje." },
          { status: 400 }
        );
      }
      console.error("Prisma error code:", error.code, "Message:", error.message);
      return NextResponse.json(
        { error: `Błąd bazy danych: ${error.message}` },
        { status: 500 }
      );
    }
    
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error("Prisma validation error:", error.message);
      return NextResponse.json(
        { 
          error: "Błąd walidacji bazy danych." 
        },
        { status: 500 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
    return NextResponse.json(
      { error: `Błąd podczas tworzenia zadania: ${errorMessage}` },
      { status: 500 }
    );
  }
}