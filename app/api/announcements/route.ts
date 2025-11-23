import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isImportant = searchParams.get('isImportant')

    const where: any = {}
    if (category) where.category = category.toUpperCase()
    if (isImportant !== null) where.isImportant = isImportant === 'true'

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            surname: true,
            role: true,
          },
        },
        readBy: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Get announcements error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania ogłoszeń' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { authorId, title, content, category, isImportant } = data

    if (!authorId || !title || !content || !category) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const announcement = await prisma.announcement.create({
      data: {
        authorId,
        title,
        content,
        category: category.toUpperCase(),
        isImportant: isImportant || false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            surname: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia ogłoszenia' },
      { status: 500 }
    )
  }
}

