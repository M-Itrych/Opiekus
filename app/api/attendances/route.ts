import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')
    const date = searchParams.get('date')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: any = {}
    if (childId) where.childId = childId
    if (date) {
      const dateObj = new Date(date)
      where.date = {
        gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        lt: new Date(dateObj.setHours(23, 59, 59, 999)),
      }
    }
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(attendances)
  } catch (error) {
    console.error('Get attendances error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania obecności' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { childId, date, status, reason } = data

    if (!childId || !date || !status) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const attendance = await prisma.attendance.upsert({
      where: {
        childId_date: {
          childId,
          date: dateObj,
        },
      },
      update: {
        status,
        reason,
      },
      create: {
        childId,
        date: dateObj,
        status,
        reason,
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    console.error('Create attendance error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia obecności' },
      { status: 500 }
    )
  }
}

