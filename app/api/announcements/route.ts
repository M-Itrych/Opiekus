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
    const { title, content, category, authorId, isImportant, eventDate, location } = body;

    // walidacja
    if (!title || !content || !category || !authorId) {
        return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        category,
        authorId,
        isImportant: isImportant || false,
        eventDate: eventDate ? new Date(eventDate) : null,
        location: location || null, 
      },
    });
    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Błąd podczas tworzenia ogłoszenia" }, { status: 500 });
  }
}

