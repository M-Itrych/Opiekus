import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const senderId = searchParams.get('senderId')
    const receiverId = searchParams.get('receiverId')
    const isRead = searchParams.get('isRead')

    const where: any = {}
    if (senderId) where.senderId = senderId
    if (receiverId) where.receiverId = receiverId
    if (isRead !== null) where.isRead = isRead === 'true'

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            surname: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            surname: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania wiadomości' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { senderId, receiverId, subject, body } = data

    if (!senderId || !receiverId || !subject || !body) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        subject,
        body,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            surname: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            surname: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Create message error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia wiadomości' },
      { status: 500 }
    )
  }
}

