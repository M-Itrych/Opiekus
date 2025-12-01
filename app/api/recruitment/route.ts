import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;
        
        if (!token) {
            return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
        }
        const payload = await verifyToken(token);
        if (!payload || (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")) {
            return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
        }

        const body = await request.json();
        const { 
            childName, childSurname, childAge, 
            parentName, parentEmail, parentPhone,
            parent2Name, parent2Email, parent2Phone,
            notes 
        } = body;

        if (!childName || !childSurname || !childAge || !parentName || !parentEmail || !parentPhone) {
            return NextResponse.json(
                { error: "Wymagane pola: imię dziecka, nazwisko dziecka, wiek, imię rodzica, email, telefon" },
                { status: 400 }
            );
        }

        const newApplication = await prisma.recruitmentApplication.create({
            data: {
                childName,
                childSurname,
                childAge: parseInt(childAge),
                parentName,
                parentEmail,
                parentPhone,
                parent2Name: parent2Name || null,
                parent2Email: parent2Email || null,
                parent2Phone: parent2Phone || null,
                notes: notes || null,
                status: "PENDING",
            },
        });

        return NextResponse.json(newApplication, { status: 201 });
    } catch (error) {
        console.error('POST /api/recruitment:', error);
        return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;
        
        if (!token) {
            return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
        }
        const payload = await verifyToken(token);
        if (!payload || (payload.role !== "HEADTEACHER" && payload.role !== "ADMIN")) {
            return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
        }

        const recruitmentApplications = await prisma.recruitmentApplication.findMany({
            orderBy: {
                applicationDate: "desc",
            },
            select: {
                id: true,
                childName: true,
                childSurname: true,
                childAge: true,
                parentName: true,
                parentEmail: true,
                parentPhone: true,
                parent2Name: true,
                parent2Email: true,
                parent2Phone: true,
                applicationDate: true,
                status: true,
                birthCertificate: true,
                medicalExamination: true,
                vaccinationCard: true,
                photos: true,
                notes: true,
                child: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        age: true,
                        group: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(recruitmentApplications);
    }   
    catch (error) {
        console.error('GET /api/recruitment:', error);
        return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
    }
}
