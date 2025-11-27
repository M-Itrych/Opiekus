import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { deleteFileFromUploadThing } from "@/lib/uploadthing-server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string; photoId: string } }
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

    const { id: galleryId, photoId } = await params;
    const userId = payload.id as string;
    const userRole = payload.role as string;
    const body = await request.json();
    const { caption } = body;

    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      select: {
        id: true,
        groupId: true,
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: "Galeria nie znaleziona" },
        { status: 404 }
      );
    }

    const photo = await prisma.galleryPhoto.findUnique({
      where: { id: photoId },
      select: {
        id: true,
        galleryId: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Zdjęcie nie znalezione" },
        { status: 404 }
      );
    }

    if (photo.galleryId !== galleryId) {
      return NextResponse.json(
        { error: "Zdjęcie nie należy do tej galerii" },
        { status: 400 }
      );
    }

    if (userRole === "HEADTEACHER" || userRole === "ADMIN") {
      const updatedPhoto = await prisma.galleryPhoto.update({
        where: { id: photoId },
        data: { caption: caption || null },
      });
      return NextResponse.json(updatedPhoto);
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

      const updatedPhoto = await prisma.galleryPhoto.update({
        where: { id: photoId },
        data: { caption: caption || null },
      });
      return NextResponse.json(updatedPhoto);
    }

    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  } catch (error) {
    console.error("Błąd podczas aktualizacji zdjęcia:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji zdjęcia" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; photoId: string } }
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

    const { id: galleryId, photoId } = await params;
    const userId = payload.id as string;
    const userRole = payload.role as string;

    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      select: {
        id: true,
        groupId: true,
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: "Galeria nie znaleziona" },
        { status: 404 }
      );
    }

    const photo = await prisma.galleryPhoto.findUnique({
      where: { id: photoId },
      select: {
        id: true,
        galleryId: true,
        url: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Zdjęcie nie znalezione" },
        { status: 404 }
      );
    }

    if (photo.galleryId !== galleryId) {
      return NextResponse.json(
        { error: "Zdjęcie nie należy do tej galerii" },
        { status: 400 }
      );
    }

    const deletePhoto = async () => {
      await prisma.galleryPhoto.delete({
        where: { id: photoId },
      });

      if (photo.url) {
        deleteFileFromUploadThing(photo.url).catch((err) => {
          console.error("Failed to delete file from UploadThing:", err);
        });
      }
    };

    if (userRole === "HEADTEACHER" || userRole === "ADMIN") {
      await deletePhoto();
      return NextResponse.json({ message: "Zdjęcie zostało usunięte" });
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

      await deletePhoto();
      return NextResponse.json({ message: "Zdjęcie zostało usunięte" });
    }

    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  } catch (error) {
    console.error("Błąd podczas usuwania zdjęcia:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania zdjęcia" },
      { status: 500 }
    );
  }
}
