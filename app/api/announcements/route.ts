import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            name: true,
            surname: true,
          }
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        }
      }
    });
    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Błąd podczas pobierania ogłoszeń" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      category,
      authorId,
      isImportant,
      eventDate,
      location,
      startTime,
      endTime,
      targetGroup,
      groupId,
    } = body;

    let finalAuthorId = authorId;

    if (!finalAuthorId) {
        const user = await prisma.user.findFirst({
            where: { role: 'HEADTEACHER' }
        });
        if (user) {
            finalAuthorId = user.id;
        } else {
            const anyUser = await prisma.user.findFirst();
            if (anyUser) {
                finalAuthorId = anyUser.id;
            }
        }
    }

    // walidacja
    if (!title || !content || !category || !finalAuthorId) {
        return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const baseEventDate = eventDate ? new Date(eventDate) : null;
    const parsedStartTime = startTime ? new Date(startTime) : baseEventDate;
    const parsedEndTime = endTime ? new Date(endTime) : null;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        category,
        authorId: finalAuthorId,
        isImportant: isImportant || false,
        eventDate: baseEventDate,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        location: location || null,
        targetGroup: targetGroup || null,
        groupId: groupId || null,
      },
    });
    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Błąd podczas tworzenia ogłoszenia" }, { status: 500 });
  }
}

