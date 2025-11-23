import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email i hasło są wymagane' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        staff: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Nieprawidłowy email lub hasło' },
        { status: 401 }
      )
    }

    const isValidPassword = user.password === password

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Nieprawidłowy email lub hasło' },
        { status: 401 }
      )
    }

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Zalogowano pomyślnie',
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas logowania' },
      { status: 500 }
    )
  }
}

