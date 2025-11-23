import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status.toUpperCase()

    const applications = await prisma.recruitmentApplication.findMany({
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
        applicationDate: 'desc',
      },
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Get recruitment applications error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania aplikacji rekrutacyjnych' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      childName,
      childSurname,
      childAge,
      parentName,
      parentEmail,
      parentPhone,
      birthCertificate,
      medicalExamination,
      vaccinationCard,
      photos,
      notes,
    } = data

    if (
      !childName ||
      !childSurname ||
      !childAge ||
      !parentName ||
      !parentEmail ||
      !parentPhone
    ) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 }
      )
    }

    const application = await prisma.recruitmentApplication.create({
      data: {
        childName,
        childSurname,
        childAge,
        parentName,
        parentEmail,
        parentPhone,
        birthCertificate: birthCertificate || false,
        medicalExamination: medicalExamination || false,
        vaccinationCard: vaccinationCard || false,
        photos: photos || false,
        notes,
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error('Create recruitment application error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia aplikacji rekrutacyjnej' },
      { status: 500 }
    )
  }
}

