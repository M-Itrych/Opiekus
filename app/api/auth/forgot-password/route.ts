import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import { sendPasswordResetEmail } from '@/lib/email';

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
      // Dla bezpieczeństwa zwracamy ten sam komunikat, nawet jeśli użytkownik nie istnieje
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

    // Wysyłanie emaila z linkiem resetującym
    try {
      await sendPasswordResetEmail(user.email, resetUrl, user.name);
      console.log('Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // W trybie deweloperskim kontynuujemy, w produkcji można zwrócić błąd
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Błąd podczas wysyłania emaila. Spróbuj ponownie później.' },
          { status: 500 }
        );
      }
    }

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

