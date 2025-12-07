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

type ParamsPromise =
  | { params: Promise<{ id: string }> }
  | { params: { id: string } };

async function resolveParams(context: ParamsPromise) {
  const maybePromise = context.params as Promise<{ id: string }> | { id: string };
  if (maybePromise && typeof (maybePromise as Promise<{ id: string }>).then === "function") {
    return await (maybePromise as Promise<{ id: string }>);
  }
  return maybePromise as { id: string };
}

export async function PATCH(req: Request, context: ParamsPromise) {
  try {
    const user = await getSessionUser();
    const authError = ensureManager(user);
    if (authError) return authError;

    const { id } = await resolveParams(context);
    const payload = await req.json();

    const updateData: Prisma.TaskUpdateInput = {};

    if (typeof payload.title === "string" && payload.title.trim()) {
      updateData.title = payload.title.trim();
    }
    if (typeof payload.description === "string" && payload.description.trim()) {
      updateData.description = payload.description.trim();
    }
    if (payload.dueDate) {
      const due = new Date(payload.dueDate);
      if (Number.isNaN(due.getTime())) {
        return NextResponse.json({ error: "Nieprawidłowa data" }, { status: 400 });
      }
      updateData.dueDate = due;
    }
    if (payload.assignedToId) {
      updateData.assignedTo = { connect: { id: payload.assignedToId } };
    }
    const normalizedPriority = normalizePriority(payload.priority);
    if (normalizedPriority) {
      updateData.priority = normalizedPriority;
    }
    const normalizedStatus = normalizeStatus(payload.status);
    if (normalizedStatus) {
      updateData.status = normalizedStatus;
    }
    const normalizedCategory = normalizeCategory(payload.category);
    if (normalizedCategory) {
      updateData.category = normalizedCategory;
    }

    if (!Object.keys(updateData).length) {
      return NextResponse.json(
        { error: "Brak danych do aktualizacji" },
        { status: 400 }
      );
    }

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, surname: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Błąd podczas aktualizacji zadania" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: ParamsPromise) {
  try {
    const user = await getSessionUser();
    const authError = ensureManager(user);
    if (authError) return authError;

    const { id } = await resolveParams(context);

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Błąd podczas usuwania zadania" }, { status: 500 });
  }
}

