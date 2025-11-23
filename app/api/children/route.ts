import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const groupId = searchParams.get('groupId')

    const where: any = {}
    if (parentId) where.parentId = parentId
    if (groupId) where.groupId = groupId

    const children = await prisma.child.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(children)
  } catch (error) {
    console.error('Get children error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania dzieci' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      name,
      surname,
      dateOfBirth,
      parentId,
      groupId,
      hasImageConsent,
      hasDataConsent,
      allergies,
      specialNeeds,
    } = data

    if (!name || !surname || !dateOfBirth || !parentId) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const child = await prisma.child.create({
      data: {
        name,
        surname,
        dateOfBirth: new Date(dateOfBirth),
        parentId,
        groupId,
        hasImageConsent: hasImageConsent || false,
        hasDataConsent: hasDataConsent || false,
        allergies: allergies || [],
        specialNeeds,
      },
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

    return NextResponse.json(child, { status: 201 })
  } catch (error: any) {
    console.error('Create child error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia dziecka' },
      { status: 500 }
    )
  }
}

