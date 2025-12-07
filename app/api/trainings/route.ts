import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { Prisma } from "@prisma/client";

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

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const includeProgress = searchParams.get("includeProgress") === "true";

    const where: Prisma.TrainingWhereInput = {};

    // Only show published trainings to teachers
    if (user.role === "TEACHER") {
      where.status = "PUBLISHED";
    } else if (user.role === "HEADTEACHER" || user.role === "ADMIN") {
      // Admins/HeadTeachers can filter by status
      if (status) {
        where.status = status as "DRAFT" | "PUBLISHED" | "ARCHIVED";
      }
    } else {
      return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
    }

    // Filter by category
    if (category) {
      where.category = category as Prisma.EnumTrainingCategoryFilter;
    }

    const trainings = await prisma.training.findMany({
      where,
      orderBy: [{ isRequired: "desc" }, { createdAt: "desc" }],
      include: includeProgress
        ? {
            progress: {
              where: { userId: user.id },
              select: {
                id: true,
                startedAt: true,
                completedAt: true,
                score: true,
              },
            },
          }
        : undefined,
    });

    // Transform to include user's progress status
    const trainingsWithProgress = trainings.map((training) => {
      const trainingWithProgress = training as typeof training & { 
        progress?: { id: string; startedAt: Date; completedAt: Date | null; score: number | null }[] 
      };
      return {
        ...training,
        userProgress: includeProgress && trainingWithProgress.progress && trainingWithProgress.progress.length > 0 
          ? trainingWithProgress.progress[0] 
          : null,
        progress: undefined, // Remove the array to clean up response
      };
    });

    return NextResponse.json(trainingsWithProgress);
  } catch (error) {
    console.error("Error fetching trainings:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania szkoleń" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
    }

    // Only HeadTeacher and Admin can create trainings
    if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, content, category, duration, isRequired, status } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const training = await prisma.training.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        content: content.trim(),
        category,
        duration: duration || 30,
        isRequired: isRequired || false,
        status: status || "DRAFT",
      },
    });

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error("Error creating training:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia szkolenia" },
      { status: 500 }
    );
  }
}

