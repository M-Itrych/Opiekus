import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const where = role ? { role: role.toUpperCase() } : {}

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        role: true,
        createdAt: true,
        staff: {
          select: {
            staffRole: true,
            permissions: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania użytkowników' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { email, password, name, surname, phone, role, staffRole, permissions, groupId } = data

    if (!email || !password || !name || !surname || !role) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const hashedPassword = password

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        surname,
        phone,
        role: role.toUpperCase(),
        ...(role === 'TEACHER' && staffRole && {
          staff: {
            create: {
              staffRole: staffRole.toUpperCase(),
              permissions: permissions || [],
              groupId,
            },
          },
        }),
      },
      include: {
        staff: true,
      },
    })

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error: any) {
    console.error('Create user error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Użytkownik z tym emailem już istnieje' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia użytkownika' },
      { status: 500 }
    )
  }
}

