import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default_secret_key_change_me'
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Adres email jest wymagany' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({
        message: 'Jeśli podany email istnieje w systemie, wysłano instrukcje resetowania hasła',
      });
    }

    const resetToken = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      type: 'password_reset'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    console.log('Password reset token generated for:', user.email);
    console.log('Reset URL:', resetUrl);

    return NextResponse.json({
      message: 'Jeśli podany email istnieje w systemie, wysłano instrukcje resetowania hasła',
      ...(process.env.NODE_ENV !== 'production' && { 
        resetToken,
        resetUrl,
        note: 'Token jest widoczny tylko w trybie deweloperskim'
      }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Błąd podczas przetwarzania żądania' },
      { status: 500 }
    );
  }
}

