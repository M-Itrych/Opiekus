import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: galleryId } = await params;
    const userId = payload.id as string;
    const userRole = payload.role as string;
    const body = await request.json();
    const { url, caption } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL zdjęcia jest wymagany" },
        { status: 400 }
      );
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      select: {
        id: true,
        groupId: true,
        photos: { select: { id: true } },
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: "Galeria nie znaleziona" },
        { status: 404 }
      );
    }

    if (gallery.photos.length >= 100) {
      return NextResponse.json(
        { error: "Galeria może mieć maksymalnie 100 zdjęć" },
        { status: 400 }
      );
    }

    if (userRole === "HEADTEACHER" || userRole === "ADMIN") {
      const photo = await prisma.galleryPhoto.create({
        data: {
          galleryId,
          url,
          caption: caption || null,
        },
      });
      return NextResponse.json(photo, { status: 201 });
    }

    if (userRole === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId },
        select: { groupId: true },
      });

      if (!staff || !staff.groupId) {
        return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
      }

      if (!gallery.groupId || gallery.groupId !== staff.groupId) {
        return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
      }

      const photo = await prisma.galleryPhoto.create({
        data: {
          galleryId,
          url,
          caption: caption || null,
        },
      });
      return NextResponse.json(photo, { status: 201 });
    }

    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  } catch (error) {
    console.error("Błąd podczas dodawania zdjęcia:", error);
    return NextResponse.json(
      { error: "Błąd podczas dodawania zdjęcia" },
      { status: 500 }
    );
  }
}
