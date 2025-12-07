import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear the session cookie
    cookieStore.delete('session');

    return NextResponse.json(
      { message: 'Wylogowano pomyślnie' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Błąd podczas wylogowywania' },
      { status: 500 }
    );
  }
}

