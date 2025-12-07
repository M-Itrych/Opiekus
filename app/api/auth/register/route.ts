import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/session';
import { UserRole, StaffRole } from '@prisma/client';

const USER_ROLE_TO_STAFF_ROLE: Partial<Record<UserRole, StaffRole>> = {
  TEACHER: 'NAUCZYCIEL',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, surname, role, secretCode, phone } = body;

    if (!email || !password || !name || !surname || !role || !secretCode) {
      return NextResponse.json(
        { error: 'Wszystkie pola są wymagane' },
        { status: 400 }
      );
    }

    const envSecret = process.env.REGISTRATION_SECRET;
    if (!envSecret || secretCode !== envSecret) {
      return NextResponse.json(
        { error: 'Nieprawidłowy kod rejestracyjny' },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Użytkownik z tym adresem email już istnieje' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        surname,
        role,
        phone: phone || null,
      },
    });

    const staffRole = USER_ROLE_TO_STAFF_ROLE[role as UserRole];
    if (staffRole) {
      await prisma.staff.create({
        data: {
          userId: user.id,
          staffRole: staffRole,
          permissions: [],
          groupId: null,
        },
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Błąd podczas rejestracji' },
      { status: 500 }
    );
  }
}

