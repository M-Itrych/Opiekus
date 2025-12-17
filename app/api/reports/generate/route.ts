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

function ensureManager(user: SessionUser | null) {
  if (!user) {
    return NextResponse.json({ error: "Nieautoryzowany dostęp" }, { status: 401 });
  }
  if (!["HEADTEACHER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }
  return null;
}

// Generate RODO (Consents) Report
async function generateRodoReport() {
  const consents = await prisma.consent.findMany({
    include: {
      child: {
        select: {
          id: true,
          name: true,
          surname: true,
          group: { select: { name: true } },
          parent: { select: { name: true, surname: true, email: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const children = await prisma.child.findMany({
    select: {
      id: true,
      name: true,
      surname: true,
      hasImageConsent: true,
      hasDataConsent: true,
      group: { select: { name: true } },
    },
  });

  // Group consents by child
  const childrenConsents = new Map<string, {
    child: { id: string; name: string; surname: string; groupName: string };
    consents: { type: string; status: string; date: Date }[];
  }>();

  for (const consent of consents) {
    const childId = consent.childId;
    if (!childrenConsents.has(childId)) {
      childrenConsents.set(childId, {
        child: {
          id: childId,
          name: consent.child.name,
          surname: consent.child.surname,
          groupName: consent.child.group?.name || "Brak grupy",
        },
        consents: [],
      });
    }
    childrenConsents.get(childId)!.consents.push({
      type: consent.consentType,
      status: consent.status,
      date: consent.date,
    });
  }

  // Summary statistics
  const stats = {
    total: children.length,
    withImageConsent: children.filter(c => c.hasImageConsent).length,
    withDataConsent: children.filter(c => c.hasDataConsent).length,
    pendingConsents: consents.filter(c => c.status === "PENDING").length,
    acceptedConsents: consents.filter(c => c.status === "ACCEPTED").length,
    rejectedConsents: consents.filter(c => c.status === "REJECTED").length,
  };

  let content = `# Raport RODO - Zgody Rodziców\n`;
  content += `Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')}\n\n`;
  content += `## Podsumowanie\n`;
  content += `- Łączna liczba dzieci: ${stats.total}\n`;
  content += `- Zgody na wizerunek: ${stats.withImageConsent}/${stats.total}\n`;
  content += `- Zgody na przetwarzanie danych: ${stats.withDataConsent}/${stats.total}\n`;
  content += `- Zgody oczekujące: ${stats.pendingConsents}\n`;
  content += `- Zgody zaakceptowane: ${stats.acceptedConsents}\n`;
  content += `- Zgody odrzucone: ${stats.rejectedConsents}\n\n`;

  content += `## Szczegóły per dziecko\n`;
  for (const child of children) {
    content += `\n### ${child.name} ${child.surname} (${child.group?.name || 'Brak grupy'})\n`;
    content += `- Zgoda na wizerunek: ${child.hasImageConsent ? '✅ TAK' : '❌ NIE'}\n`;
    content += `- Zgoda na przetwarzanie danych: ${child.hasDataConsent ? '✅ TAK' : '❌ NIE'}\n`;
  }

  return {
    title: `Raport RODO - Zgody rodziców`,
    content,
    reportType: "rodo",
  };
}

// Generate Attendance Report
async function generateAttendanceReport(periodStart?: Date, periodEnd?: Date) {
  const startDate = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = periodEnd || new Date();

  const attendances = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      child: {
        select: {
          id: true,
          name: true,
          surname: true,
          group: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const groups = await prisma.group.findMany({
    select: { id: true, name: true },
  });

  // Stats per group
  const groupStats = new Map<string, {
    name: string;
    present: number;
    absent: number;
    pending: number;
  }>();

  for (const group of groups) {
    groupStats.set(group.id, { name: group.name, present: 0, absent: 0, pending: 0 });
  }

  for (const attendance of attendances) {
    const groupId = attendance.child.group?.id;
    if (groupId && groupStats.has(groupId)) {
      const stats = groupStats.get(groupId)!;
      if (attendance.status === "PRESENT") stats.present++;
      else if (attendance.status === "ABSENT") stats.absent++;
      else if (attendance.status === "PENDING") stats.pending++;
    }
  }

  const totalPresent = attendances.filter(a => a.status === "PRESENT").length;
  const totalAbsent = attendances.filter(a => a.status === "ABSENT").length;
  const totalPending = attendances.filter(a => a.status === "PENDING").length;

  let content = `# Raport Obecności\n`;
  content += `Okres: ${startDate.toLocaleDateString('pl-PL')} - ${endDate.toLocaleDateString('pl-PL')}\n`;
  content += `Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')}\n\n`;

  content += `## Podsumowanie ogólne\n`;
  content += `- Obecności: ${totalPresent}\n`;
  content += `- Nieobecności: ${totalAbsent}\n`;
  content += `- Zgłoszone (oczekujące): ${totalPending}\n\n`;

  content += `## Statystyki per grupa\n`;
  for (const [, stats] of groupStats) {
    const total = stats.present + stats.absent + stats.pending;
    if (total === 0) continue;
    const attendanceRate = total > 0 ? ((stats.present / total) * 100).toFixed(1) : "0";
    content += `\n### ${stats.name}\n`;
    content += `- Obecności: ${stats.present}\n`;
    content += `- Nieobecności: ${stats.absent}\n`;
    content += `- Zgłoszone: ${stats.pending}\n`;
    content += `- Frekwencja: ${attendanceRate}%\n`;
  }

  content += `\n## Ostatnie nieobecności\n`;
  const absences = attendances.filter(a => a.status === "ABSENT").slice(0, 20);
  for (const absence of absences) {
    content += `- ${absence.date.toLocaleDateString('pl-PL')}: ${absence.child.name} ${absence.child.surname}`;
    if (absence.reason) content += ` - Powód: ${absence.reason}`;
    content += `\n`;
  }

  return {
    title: `Raport obecności - ${startDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}`,
    content,
    reportType: "obecnosc",
    periodStart: startDate,
    periodEnd: endDate,
  };
}

// Generate Financial Report
async function generateFinancialReport(periodStart?: Date, periodEnd?: Date) {
  const startDate = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = periodEnd || new Date();

  const payments = await prisma.payment.findMany({
    where: {
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      child: {
        select: {
          id: true,
          name: true,
          surname: true,
          group: { select: { name: true } },
        },
      },
    },
    orderBy: { dueDate: "desc" },
  });

  const stats = {
    totalPending: 0,
    totalPaid: 0,
    totalOverdue: 0,
    countPending: 0,
    countPaid: 0,
    countOverdue: 0,
  };

  for (const payment of payments) {
    if (payment.status === "PENDING") {
      stats.totalPending += payment.amount;
      stats.countPending++;
    } else if (payment.status === "PAID") {
      stats.totalPaid += payment.amount;
      stats.countPaid++;
    } else if (payment.status === "OVERDUE") {
      stats.totalOverdue += payment.amount;
      stats.countOverdue++;
    }
  }

  let content = `# Raport Finansowy\n`;
  content += `Okres: ${startDate.toLocaleDateString('pl-PL')} - ${endDate.toLocaleDateString('pl-PL')}\n`;
  content += `Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')}\n\n`;

  content += `## Podsumowanie\n`;
  content += `- Opłacone: ${stats.totalPaid.toFixed(2)} zł (${stats.countPaid} płatności)\n`;
  content += `- Oczekujące: ${stats.totalPending.toFixed(2)} zł (${stats.countPending} płatności)\n`;
  content += `- Zaległe: ${stats.totalOverdue.toFixed(2)} zł (${stats.countOverdue} płatności)\n`;
  content += `- **Razem do zapłaty**: ${(stats.totalPending + stats.totalOverdue).toFixed(2)} zł\n\n`;

  content += `## Lista zaległości\n`;
  const overdue = payments.filter(p => p.status === "OVERDUE");
  if (overdue.length === 0) {
    content += `Brak zaległych płatności.\n`;
  } else {
    for (const payment of overdue) {
      content += `- ${payment.child.name} ${payment.child.surname}: ${payment.amount.toFixed(2)} zł - ${payment.description}\n`;
      content += `  (termin: ${payment.dueDate.toLocaleDateString('pl-PL')})\n`;
    }
  }

  content += `\n## Szczegóły płatności\n`;
  for (const payment of payments.slice(0, 30)) {
    const statusIcon = payment.status === "PAID" ? "✅" : payment.status === "OVERDUE" ? "❌" : "⏳";
    content += `- ${statusIcon} ${payment.child.name} ${payment.child.surname}: ${payment.amount.toFixed(2)} zł - ${payment.description}\n`;
  }

  return {
    title: `Raport finansowy - ${startDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}`,
    content,
    reportType: "finansowy",
    periodStart: startDate,
    periodEnd: endDate,
  };
}

// Generate Statistics Report
async function generateStatisticsReport() {
  const groups = await prisma.group.findMany({
    include: {
      children: {
        select: {
          id: true,
          name: true,
          surname: true,
          age: true,
          diet: true,
          allergies: true,
          specialNeeds: true,
        },
      },
      room: { select: { name: true, capacity: true } },
      _count: { select: { children: true, staff: true } },
    },
  });

  const totalChildren = groups.reduce((sum, g) => sum + g._count.children, 0);
  const totalCapacity = groups.reduce((sum, g) => sum + g.maxCapacity, 0);
  const totalStaff = groups.reduce((sum, g) => sum + g._count.staff, 0);

  // Diet breakdown
  const dietStats: Record<string, number> = {};
  const allergyCount = { withAllergies: 0, withSpecialNeeds: 0 };

  for (const group of groups) {
    for (const child of group.children) {
      dietStats[child.diet] = (dietStats[child.diet] || 0) + 1;
      if (child.allergies && child.allergies.length > 0) allergyCount.withAllergies++;
      if (child.specialNeeds) allergyCount.withSpecialNeeds++;
    }
  }

  let content = `# Statystyki Przedszkola\n`;
  content += `Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')}\n\n`;

  content += `## Podsumowanie ogólne\n`;
  content += `- Łączna liczba dzieci: ${totalChildren}\n`;
  content += `- Łączna pojemność: ${totalCapacity}\n`;
  content += `- Wypełnienie: ${((totalChildren / totalCapacity) * 100).toFixed(1)}%\n`;
  content += `- Liczba pracowników: ${totalStaff}\n\n`;

  content += `## Statystyki per grupa\n`;
  for (const group of groups) {
    const fillRate = ((group._count.children / group.maxCapacity) * 100).toFixed(1);
    content += `\n### ${group.name}\n`;
    content += `- Dzieci: ${group._count.children}/${group.maxCapacity} (${fillRate}%)\n`;
    content += `- Zakres wiekowy: ${group.ageRange}\n`;
    content += `- Sala: ${group.room?.name || 'Brak przypisania'}\n`;
    content += `- Pracownicy: ${group._count.staff}\n`;

    if (group.children.length > 0) {
      const ages = group.children.map(c => c.age);
      const avgAge = (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1);
      content += `- Średni wiek: ${avgAge} lat\n`;
    }
  }

  content += `\n## Diety i alergie\n`;
  for (const [diet, count] of Object.entries(dietStats)) {
    const dietLabel = {
      STANDARD: "Standardowa",
      VEGETARIAN: "Wegetariańska",
      VEGAN: "Wegańska",
      GLUTEN_FREE: "Bezglutenowa",
      LACTOSE_FREE: "Bez laktozy",
      CUSTOM: "Indywidualna",
    }[diet] || diet;
    content += `- ${dietLabel}: ${count} dzieci\n`;
  }
  content += `\n- Dzieci z alergiami: ${allergyCount.withAllergies}\n`;
  content += `- Dzieci z potrzebami specjalnymi: ${allergyCount.withSpecialNeeds}\n`;

  return {
    title: `Statystyki grup - ${new Date().getFullYear()}`,
    content,
    reportType: "statystyki",
  };
}

type ReportData = {
  title: string;
  content: string;
  reportType: string;
  periodStart?: Date;
  periodEnd?: Date;
};

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const authError = ensureManager(user);
    if (authError) return authError;

    const body = await request.json();
    const { reportType, periodStart, periodEnd } = body;

    if (!reportType) {
      return NextResponse.json({ error: "Typ raportu jest wymagany" }, { status: 400 });
    }

    let reportData: ReportData;
    const parsedStart = periodStart ? new Date(periodStart) : undefined;
    const parsedEnd = periodEnd ? new Date(periodEnd) : undefined;

    switch (reportType.toLowerCase()) {
      case "rodo":
        reportData = await generateRodoReport();
        break;
      case "obecnosc":
        reportData = await generateAttendanceReport(parsedStart, parsedEnd);
        break;
      case "finansowy":
        reportData = await generateFinancialReport(parsedStart, parsedEnd);
        break;
      case "statystyki":
        reportData = await generateStatisticsReport();
        break;
      default:
        return NextResponse.json({ error: "Nieznany typ raportu" }, { status: 400 });
    }

    // Save the report to database
    const report = await prisma.report.create({
      data: {
        authorId: user!.id,
        title: reportData.title,
        content: reportData.content,
        reportType: reportData.reportType,
        periodStart: reportData.periodStart ?? null,
        periodEnd: reportData.periodEnd ?? null,
      },
      include: {
        author: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Błąd podczas generowania raportu" },
      { status: 500 }
    );
  }
}
