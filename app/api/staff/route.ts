import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken, hashPassword } from "@/lib/session";
import { StaffRole, UserRole } from "@prisma/client";
import { serializeStaff, STAFF_ROLE_TO_USER_ROLE, StaffWithRelations } from "./utils";

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

function normalizeStaffRole(role: unknown): StaffRole | null {
  if (!role || typeof role !== "string") return null;
  const value = role.toUpperCase();
  if (["NAUCZYCIEL", "INTENDENTKA", "SEKRETARKA", "POMOCNIK"].includes(value)) {
    return value as StaffRole;
  }
  return null;
}

function normalizePermissions(permissions: unknown): string[] {
  if (Array.isArray(permissions)) {
    return permissions
      .map((perm) => (typeof perm === "string" ? perm.trim() : ""))
      .filter(Boolean);
  }

  if (typeof permissions === "string") {
    return permissions
      .split(",")
      .map((perm) => perm.trim())
      .filter(Boolean);
  }

  return [];
}

function resolveUserRole(staffRole: StaffRole, explicitRole?: UserRole) {
  if (explicitRole) return explicitRole;
  return STAFF_ROLE_TO_USER_ROLE[staffRole];
}

function normalizeUserRole(role: unknown): UserRole | undefined {
  if (!role || typeof role !== "string") return undefined;
  if (["ADMIN", "HEADTEACHER", "TEACHER", "PARENT"].includes(role)) {
    return role as UserRole;
  }
  return undefined;
}

export async function GET() {
  try {
    const { error } = await authorize();
    if (error) return error;

    const staffMembers = await prisma.staff.findMany({
      include: {
        user: true,
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      staffMembers.map((member) => serializeStaff(member as StaffWithRelations))
    );
  } catch (err) {
    console.error("Error fetching staff:", err);
    return NextResponse.json(
      { error: "Błąd podczas pobierania pracowników" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await authorize();
    if (error) return error;

    const body = await request.json();
    const {
      name,
      surname,
      email,
      phone,
      password,
      staffRole,
      permissions,
      groupId,
      userRole,
    } = body;

    if (!name || !surname || !email || !password || !staffRole) {
      return NextResponse.json(
        { error: "Wymagane pola: imię, nazwisko, email, hasło, rola" },
        { status: 400 }
      );
    }

    const normalizedStaffRole = normalizeStaffRole(staffRole);
    if (!normalizedStaffRole) {
      return NextResponse.json({ error: "Nieprawidłowa rola pracownika" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Użytkownik z tym adresem email już istnieje" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const normalizedPermissions = normalizePermissions(permissions);
    const resolvedUserRole = resolveUserRole(
      normalizedStaffRole,
      normalizeUserRole(userRole)
    );

    const user = await prisma.user.create({
      data: {
        name,
        surname,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: resolvedUserRole,
      },
    });

    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        staffRole: normalizedStaffRole,
        permissions: normalizedPermissions,
        groupId: groupId || null,
      },
      include: {
        user: true,
        group: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(serializeStaff(staff as StaffWithRelations), { status: 201 });
  } catch (err) {
    console.error("Error creating staff member:", err);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia pracownika" },
      { status: 500 }
    );
  }
}

