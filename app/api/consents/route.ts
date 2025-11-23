import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')
    const consentType = searchParams.get('consentType')
    const status = searchParams.get('status')

    const where: any = {}
    if (childId) where.childId = childId
    if (consentType) where.consentType = consentType.toUpperCase()
    if (status) where.status = status.toUpperCase()

    const consents = await prisma.consent.findMany({
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

    return NextResponse.json(consents)
  } catch (error) {
    console.error('Get consents error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania zgód' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { childId, consentType, status, expiryDate } = data

    if (!childId || !consentType) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const consent = await prisma.consent.create({
      data: {
        childId,
        consentType: consentType.toUpperCase(),
        status: status?.toUpperCase() || 'PENDING',
        expiryDate: expiryDate ? new Date(expiryDate) : null,
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

    return NextResponse.json(consent, { status: 201 })
  } catch (error) {
    console.error('Create consent error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia zgody' },
      { status: 500 }
    )
  }
}

