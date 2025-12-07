import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { hashPassword } from '@/lib/session';

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default_secret_key_change_me'
);

interface ResetTokenPayload {
  userId: string;
  email: string;
  type: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token i nowe hasło są wymagane' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Hasło musi mieć co najmniej 8 znaków' },
        { status: 400 }
      );
    }

    let payload: ResetTokenPayload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, secretKey);
      payload = verifiedPayload as unknown as ResetTokenPayload;

      if (payload.type !== 'password_reset') {
        return NextResponse.json(
          { error: 'Nieprawidłowy token resetowania hasła' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Token wygasł lub jest nieprawidłowy' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Nie znaleziono użytkownika' },
        { status: 404 }
      );
    }

    if (user.email !== payload.email) {
      return NextResponse.json(
        { error: 'Token jest nieprawidłowy' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: 'Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Błąd podczas resetowania hasła' },
      { status: 500 }
    );
  }
}

