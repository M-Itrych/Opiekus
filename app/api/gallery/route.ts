import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { GalleryStatus } from "@prisma/client";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const userId = payload.id as string;
    const userRole = payload.role as string;

    if (userRole === "HEADTEACHER" || userRole === "ADMIN") {
      const galleries = await prisma.gallery.findMany({
        include: { photos: true },
        orderBy: { date: "desc" },
      });
      return NextResponse.json(galleries);
    }

    if (userRole === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId },
        select: { groupId: true },
      });

      if (!staff || !staff.groupId) {
        return NextResponse.json([]);
      }

      const galleries = await prisma.gallery.findMany({
        where: { groupId: staff.groupId },
        include: { photos: true },
        orderBy: { date: "desc" },
      });
      return NextResponse.json(galleries);
    }

    if (userRole === "PARENT") {
      const children = await prisma.child.findMany({
        where: { parentId: userId },
        select: { groupId: true },
      });

      const groupIds = children
        .map((c) => c.groupId)
        .filter((id): id is string => id !== null);

      if (groupIds.length === 0) {
        return NextResponse.json([]);
      }

      const galleries = await prisma.gallery.findMany({
        where: {
          groupId: { in: groupIds },
          status: "PUBLISHED",
          childrenWithoutConsent: 0,
        },
        include: { photos: true },
        orderBy: { date: "desc" },
      });
      return NextResponse.json(galleries);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Błąd podczas pobierania galerii:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania galerii" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const userId = payload.id as string;
    const userRole = payload.role as string;

    const body = await request.json();
    const {
      title,
      date,
      groupId,
      status,
      childrenWithConsent,
      childrenWithoutConsent,
      photos,
    } = body;

    if (!title || !photos || !Array.isArray(photos)) {
      return NextResponse.json(
        { error: "Wymagane pola: title, photos" },
        { status: 400 }
      );
    }

    if (photos.length === 0) {
      return NextResponse.json(
        { error: "Galeria musi mieć przynajmniej jedno zdjęcie" },
        { status: 400 }
      );
    }

    if (photos.length > 100) {
      return NextResponse.json(
        { error: "Galeria może mieć maksymalnie 100 zdjęć" },
        { status: 400 }
      );
    }

    let finalStatus: GalleryStatus = status || "DRAFT";
    if (!status) {
      if (childrenWithoutConsent > 0) {
        finalStatus = "RESTRICTED";
      } else if (childrenWithConsent > 0) {
        finalStatus = "PUBLISHED";
      } else {
        finalStatus = "DRAFT";
      }
    }

    if (userRole === "HEADTEACHER" || userRole === "ADMIN") {
      const gallery = await prisma.gallery.create({
        data: {
          title,
          date: date ? new Date(date) : new Date(),
          status: finalStatus,
          groupId: groupId || null,
          childrenWithConsent: childrenWithConsent || 0,
          childrenWithoutConsent: childrenWithoutConsent || 0,
          photos: {
            create: photos.map((photo: { url: string; caption?: string }) => ({
              url: photo.url,
              caption: photo.caption || null,
            })),
          },
        },
        include: { photos: true },
      });

      return NextResponse.json(gallery, { status: 201 });
    }

    if (userRole === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId },
        select: { groupId: true },
      });

      if (!staff || !staff.groupId) {
        return NextResponse.json(
          { error: "Nie jesteś przypisany do żadnej grupy" },
          { status: 403 }
        );
      }

      if (groupId && groupId !== staff.groupId) {
        return NextResponse.json(
          { error: "Możesz tworzyć galerie tylko dla swojej grupy" },
          { status: 403 }
        );
      }

      const gallery = await prisma.gallery.create({
        data: {
          title,
          date: date ? new Date(date) : new Date(),
          status: finalStatus,
          groupId: staff.groupId,
          childrenWithConsent: childrenWithConsent || 0,
          childrenWithoutConsent: childrenWithoutConsent || 0,
          photos: {
            create: photos.map((photo: { url: string; caption?: string }) => ({
              url: photo.url,
              caption: photo.caption || null,
            })),
          },
        },
        include: { photos: true },
      });

      return NextResponse.json(gallery, { status: 201 });
    }

    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  } catch (error) {
    console.error("Błąd podczas tworzenia galerii:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia galerii" },
      { status: 500 }
    );
  }
}
