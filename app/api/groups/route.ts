import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const groups = await prisma.group.findMany({
      include: {
        room: {
          select: {
            id: true,
            name: true,
            capacity: true,
            status: true,
          },
        },
        children: {
          select: {
            id: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const groupsWithCounts = groups.map((group) => ({
      ...group,
      childrenCount: group.children.length,
    }))

    return NextResponse.json(groupsWithCounts)
  } catch (error) {
    console.error('Get groups error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania grup' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { name, ageRange, maxCapacity, roomId } = data

    if (!name || !ageRange || !maxCapacity) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name,
        ageRange,
        maxCapacity,
        roomId,
      },
      include: {
        room: true,
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Create group error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia grupy' },
      { status: 500 }
    )
  }
}

