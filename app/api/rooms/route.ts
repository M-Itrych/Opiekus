import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        groups: {
          select: {
            id: true,
            name: true,
            children: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const roomsWithStats = rooms.map((room) => ({
      ...room,
      occupiedCapacity: room.groups.reduce(
        (sum, group) => sum + group.children.length,
        0
      ),
    }))

    return NextResponse.json(roomsWithStats)
  } catch (error) {
    console.error('Get rooms error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania sal' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { name, capacity, status, description } = data

    if (!name || !capacity) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const room = await prisma.room.create({
      data: {
        name,
        capacity,
        status: status?.toUpperCase() || 'AVAILABLE',
        description,
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Create room error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia sali' },
      { status: 500 }
    )
  }
}

