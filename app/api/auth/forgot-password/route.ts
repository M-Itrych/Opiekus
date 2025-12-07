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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    // Always return success message to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Jeśli podany email istnieje w systemie, wysłano instrukcje resetowania hasła',
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      type: 'password_reset'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secretKey);

    // In a production environment, you would:
    // 1. Store the token hash in the database
    // 2. Send an email with the reset link
    // For now, we return the token in the response (for testing purposes)
    
    // Example reset URL that would be sent via email:
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // In production, send email here using nodemailer or similar
    // await sendResetEmail(user.email, resetUrl);

    console.log('Password reset token generated for:', user.email);
    console.log('Reset URL:', resetUrl);

    return NextResponse.json({
      message: 'Jeśli podany email istnieje w systemie, wysłano instrukcje resetowania hasła',
      // Include token in development mode for testing
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

