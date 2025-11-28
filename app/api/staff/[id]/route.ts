import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken, hashPassword } from "@/lib/session";
import { Prisma, StaffRole } from "@prisma/client";
import { serializeStaff, StaffWithRelations } from "../utils";

type SessionUser = {
  id: string;
  role: "ADMIN" | "HEADTEACHER" | "TEACHER" | "PARENT";
};

type ParamsPromise =
  | { params: Promise<{ id: string }> }
  | { params: { id: string } };

async function authorize(): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return { error: NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 }) };
  }

  const payload = await verifyToken(token);

  if (!payload || (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")) {
    return { error: NextResponse.json({ error: "Brak uprawnień" }, { status: 403 }) };
  }

  return { user: payload as SessionUser };
}

async function resolveParams(context: ParamsPromise) {
  const maybePromise = context.params as Promise<{ id: string }> | { id: string };
  if (maybePromise && typeof (maybePromise as Promise<{ id: string }>).then === "function") {
    return await (maybePromise as Promise<{ id: string }>);
  }
  return maybePromise as { id: string };
}

function normalizeStaffRole(value: unknown): StaffRole | undefined {
  if (!value || typeof value !== "string") return undefined;
  const upper = value.toUpperCase();
  if (["NAUCZYCIEL", "INTENDENTKA", "SEKRETARKA", "POMOCNIK"].includes(upper)) {
    return upper as StaffRole;
  }
  return undefined;
}

function normalizePermissions(value: unknown): string[] | undefined {
  if (typeof value === "undefined") return undefined;
  if (Array.isArray(value)) {
    return value
      .map((perm) => (typeof perm === "string" ? perm.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((perm) => perm.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeGroupId(value: unknown) {
  if (typeof value === "undefined") return undefined;
  if (value === null || value === "null" || value === "") return null;
  if (typeof value === "string") return value;
  return undefined;
}

export async function PATCH(request: Request, context: ParamsPromise) {
  try {
    const auth = await authorize();
    if ("error" in auth) return auth.error;

    const { id } = await resolveParams(context);
    const body = await request.json();

    const staffRole = normalizeStaffRole(body.staffRole);
    const permissions = normalizePermissions(body.permissions);
    const normalizedGroupId = normalizeGroupId(body.groupId);

    const staffUpdateData: Prisma.StaffUpdateInput = {};

    if (typeof normalizedGroupId !== "undefined") {
      staffUpdateData.group =
        normalizedGroupId === null
          ? { disconnect: true }
          : { connect: { id: normalizedGroupId } };
    }

    if (staffRole) {
      staffUpdateData.staffRole = staffRole;
    }

    if (typeof permissions !== "undefined") {
      staffUpdateData.permissions = { set: permissions };
    }

    const userUpdateData: Prisma.UserUpdateInput = {};
    if (body.name) userUpdateData.name = body.name.trim();
    if (body.surname) userUpdateData.surname = body.surname.trim();
    if (body.email) userUpdateData.email = body.email.trim();
    if (typeof body.phone !== "undefined") {
      userUpdateData.phone = body.phone ? body.phone.trim() : null;
    }
    if (body.password) {
      userUpdateData.password = await hashPassword(body.password);
    }

    if (
      !Object.keys(staffUpdateData).length &&
      !Object.keys(userUpdateData).length
    ) {
      return NextResponse.json(
        { error: "Brak danych do aktualizacji" },
        { status: 400 }
      );
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        ...staffUpdateData,
        user: Object.keys(userUpdateData).length ? { update: userUpdateData } : undefined,
      },
      include: {
        user: true,
        group: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(serializeStaff(updatedStaff as StaffWithRelations));
  } catch (error) {
    console.error("Error updating staff record:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji pracownika" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: ParamsPromise) {
  try {
    const auth = await authorize();
    if ("error" in auth) return auth.error;

    const { id } = await resolveParams(context);
    const staffMember = await prisma.staff.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!staffMember) {
      return NextResponse.json({ error: "Pracownik nie znaleziony" }, { status: 404 });
    }

    await prisma.staff.delete({ where: { id } });
    await prisma.user.delete({ where: { id: staffMember.userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff record:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania pracownika" },
      { status: 500 }
    );
  }
}
