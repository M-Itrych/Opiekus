import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const child = await prisma.child.findUnique({
      where: { id: params.id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            ageRange: true,
          },
        },
        attendances: {
          orderBy: {
            date: 'desc',
          },
          take: 30,
        },
        consents: true,
      },
    })

    if (!child) {
      return NextResponse.json(
        { error: 'Dziecko nie zostało znalezione' },
        { status: 404 }
      )
    }

    return NextResponse.json(child)
  } catch (error) {
    console.error('Get child error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania dziecka' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const {
      name,
      surname,
      dateOfBirth,
      groupId,
      hasImageConsent,
      hasDataConsent,
      allergies,
      specialNeeds,
    } = data

    const updateData: any = {}
    if (name) updateData.name = name
    if (surname) updateData.surname = surname
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth)
    if (groupId !== undefined) updateData.groupId = groupId
    if (hasImageConsent !== undefined) updateData.hasImageConsent = hasImageConsent
    if (hasDataConsent !== undefined) updateData.hasDataConsent = hasDataConsent
    if (allergies !== undefined) updateData.allergies = allergies
    if (specialNeeds !== undefined) updateData.specialNeeds = specialNeeds

    const child = await prisma.child.update({
      where: { id: params.id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(child)
  } catch (error: any) {
    console.error('Update child error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Dziecko nie zostało znalezione' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji dziecka' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.child.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Dziecko zostało usunięte' })
  } catch (error: any) {
    console.error('Delete child error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Dziecko nie zostało znalezione' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania dziecka' },
      { status: 500 }
    )
  }
}

