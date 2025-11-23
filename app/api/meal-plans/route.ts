import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (groupId) where.groupId = groupId
    if (date) {
      const dateObj = new Date(date)
      where.date = {
        gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        lt: new Date(dateObj.setHours(23, 59, 59, 999)),
      }
    }
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(mealPlans)
  } catch (error) {
    console.error('Get meal plans error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania jadłospisu' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { groupId, date, mealType, name, description, allergens } = data

    if (!date || !mealType || !name) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        groupId,
        date: new Date(date),
        mealType,
        name,
        description,
        allergens: allergens || [],
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(mealPlan, { status: 201 })
  } catch (error) {
    console.error('Create meal plan error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia jadłospisu' },
      { status: 500 }
    )
  }
}

