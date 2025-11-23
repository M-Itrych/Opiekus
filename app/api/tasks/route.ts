import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assignedToId = searchParams.get('assignedToId')
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const where: any = {}
    if (assignedToId) where.assignedToId = assignedToId
    if (status) where.status = status.toUpperCase()
    if (category) where.category = category.toUpperCase()

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania zadań' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { assignedToId, title, description, category, dueDate } = data

    if (!assignedToId || !title || !category) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        assignedToId,
        title,
        description,
        category: category.toUpperCase(),
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia zadania' },
      { status: 500 }
    )
  }
}

