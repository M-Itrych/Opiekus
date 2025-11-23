import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status.toUpperCase()

    const galleries = await prisma.gallery.findMany({
      where,
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            caption: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    const galleriesWithStats = galleries.map((gallery) => ({
      ...gallery,
      photoCount: gallery.photos.length,
    }))

    return NextResponse.json(galleriesWithStats)
  } catch (error) {
    console.error('Get galleries error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania galerii' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { title, date, status, childrenWithConsent, childrenWithoutConsent } = data

    if (!title || !date) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const gallery = await prisma.gallery.create({
      data: {
        title,
        date: new Date(date),
        status: status?.toUpperCase() || 'DRAFT',
        childrenWithConsent: childrenWithConsent || 0,
        childrenWithoutConsent: childrenWithoutConsent || 0,
      },
    })

    return NextResponse.json(gallery, { status: 201 })
  } catch (error) {
    console.error('Create gallery error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia galerii' },
      { status: 500 }
    )
  }
}

