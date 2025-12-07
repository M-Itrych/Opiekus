import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { deleteFilesFromUploadThing } from "@/lib/uploadthing-server";

export async function GET(
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

    const { id } = await params;
    const userId = payload.id as string;
    const userRole = payload.role as string;

    const gallery = await prisma.gallery.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { createdAt: "desc" },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: "Galeria nie znaleziona" },
        { status: 404 }
      );
    }

    if (userRole === "HEADTEACHER" || userRole === "ADMIN") {
      return NextResponse.json(gallery);
    }

    if (userRole === "TEACHER") {
      const staff = await prisma.staff.findUnique({
        where: { userId },
        select: { groupId: true },
      });

      if (!staff || !staff.groupId) {
        return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
      }

      if (gallery.groupId && gallery.groupId !== staff.groupId) {
        return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
      }

      return NextResponse.json(gallery);
    }

    if (userRole === "PARENT") {
      if (gallery.status !== "PUBLISHED") {
        return NextResponse.json(
          { error: "Brak dostępu do tej galerii" },
          { status: 403 }
        );
      }

      if (gallery.childrenWithoutConsent > 0) {
        return NextResponse.json(
          { error: "Brak dostępu do tej galerii" },
          { status: 403 }
        );
      }

      if (gallery.groupId) {
        const hasChildInGroup = await prisma.child.findFirst({
          where: {
            parentId: userId,
            groupId: gallery.groupId,
          },
        });

        if (!hasChildInGroup) {
          return NextResponse.json(
            { error: "Brak dostępu do tej galerii" },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(gallery);
    }

    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  } catch (error) {
    console.error("Błąd podczas pobierania szczegółów galerii:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania galerii" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const userRole = payload.role as string;
    if (userRole !== "HEADTEACHER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, status, groupId, childrenWithConsent, childrenWithoutConsent } = body;

    const updatedGallery = await prisma.gallery.update({
      where: { id },
      data: {
        title,
        status,
        groupId: groupId || null,
        childrenWithConsent: childrenWithConsent ?? undefined,
        childrenWithoutConsent: childrenWithoutConsent ?? undefined,
      },
    });

    return NextResponse.json(updatedGallery);
  } catch (error) {
    console.error("Błąd podczas aktualizacji galerii:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji galerii" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;
    const userId = payload.id as string;
    const userRole = payload.role as string;

    const gallery = await prisma.gallery.findUnique({
      where: { id },
      select: {
        id: true,
        groupId: true,
        status: true,
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: "Galeria nie znaleziona" },
        { status: 404 }
      );
    }

    const deleteGalleryWithPhotos = async () => {
      const photos = await prisma.galleryPhoto.findMany({
        where: { galleryId: id },
        select: { url: true },
      });

      await prisma.galleryPhoto.deleteMany({
        where: { galleryId: id },
      });

      await prisma.gallery.delete({
        where: { id },
      });

      if (photos.length > 0) {
        const urls = photos.map((p) => p.url);
        deleteFilesFromUploadThing(urls).catch((err) => {
          console.error("Failed to delete files from UploadThing:", err);
        });
      }
    };

    if (userRole === "HEADTEACHER" || userRole === "ADMIN") {
      await deleteGalleryWithPhotos();
      return NextResponse.json({ message: "Galeria została usunięta" });
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

      await deleteGalleryWithPhotos();
      return NextResponse.json({ message: "Galeria została usunięta" });
    }

    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  } catch (error) {
    console.error("Błąd podczas usuwania galerii:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania galerii" },
      { status: 500 }
    );
  }
}
