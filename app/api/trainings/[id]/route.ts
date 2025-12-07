import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";

type SessionUser = {
  id: string;
  role: "ADMIN" | "HEADTEACHER" | "TEACHER" | "PARENT";
};

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return payload as SessionUser;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { id } = await params;

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        progress: {
          where: { userId: user.id },
          select: {
            id: true,
            startedAt: true,
            completedAt: true,
            score: true,
          },
        },
      },
    });

    if (!training) {
      return NextResponse.json({ error: "Szkolenie nie istnieje" }, { status: 404 });
    }

    // Teachers can only see published trainings
    if (user.role === "TEACHER" && training.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Szkolenie niedostępne" }, { status: 403 });
    }

    return NextResponse.json({
      ...training,
      userProgress: training.progress?.length > 0 ? training.progress[0] : null,
      progress: undefined,
    });
  } catch (error) {
    console.error("Error fetching training:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania szkolenia" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Check if this is a progress update (for teachers)
    if (body.action === "start" || body.action === "complete") {
      // Any staff can update their own progress
      if (!["TEACHER", "HEADTEACHER", "ADMIN"].includes(user.role)) {
        return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
      }

      const training = await prisma.training.findUnique({
        where: { id },
      });

      if (!training || training.status !== "PUBLISHED") {
        return NextResponse.json({ error: "Szkolenie niedostępne" }, { status: 404 });
      }

      if (body.action === "start") {
        // Start training - create or update progress
        const progress = await prisma.trainingProgress.upsert({
          where: {
            trainingId_userId: {
              trainingId: id,
              userId: user.id,
            },
          },
          update: {
            startedAt: new Date(),
          },
          create: {
            trainingId: id,
            userId: user.id,
            startedAt: new Date(),
          },
        });

        return NextResponse.json(progress);
      }

      if (body.action === "complete") {
        // Complete training
        const progress = await prisma.trainingProgress.upsert({
          where: {
            trainingId_userId: {
              trainingId: id,
              userId: user.id,
            },
          },
          update: {
            completedAt: new Date(),
            score: body.score || null,
          },
          create: {
            trainingId: id,
            userId: user.id,
            startedAt: new Date(),
            completedAt: new Date(),
            score: body.score || null,
          },
        });

        return NextResponse.json(progress);
      }
    }

    // Only HeadTeacher and Admin can update training details
    if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { title, description, content, category, duration, isRequired, status } = body;

    const training = await prisma.training.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(content && { content: content.trim() }),
        ...(category && { category }),
        ...(duration && { duration }),
        ...(isRequired !== undefined && { isRequired }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(training);
  } catch (error) {
    console.error("Error updating training:", error);
    return NextResponse.json(
      { error: "Błąd podczas aktualizacji szkolenia" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    // Only HeadTeacher and Admin can delete trainings
    if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    // Delete progress records first
    await prisma.trainingProgress.deleteMany({
      where: { trainingId: id },
    });

    // Delete the training
    await prisma.training.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting training:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania szkolenia" },
      { status: 500 }
    );
  }
}

