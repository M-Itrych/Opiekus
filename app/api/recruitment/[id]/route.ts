import { prisma } from "@/lib/prisma";
import { hashPassword, verifyToken } from "@/lib/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function generatePassword(length = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

        const { id } = await params;
        const recruitmentApplication = await prisma.recruitmentApplication.update({
            where: { id },
            data: {
                status: "VERIFIED",
                birthCertificate: true,
                medicalExamination: true,
                vaccinationCard: true,
                photos: true,
            },
        });

        return NextResponse.json(recruitmentApplication);
    }
    catch (error) {
        console.error('POST /api/recruitment/[id]:', error);
        return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

        const { id } = await params;
        
        const application = await prisma.recruitmentApplication.findUnique({
            where: { id },
        });

        if (!application) {
            return NextResponse.json({ error: "Nie znaleziono wniosku" }, { status: 404 });
        }

        if (application.status === "ACCEPTED") {
            return NextResponse.json({ error: "Wniosek został już zaakceptowany" }, { status: 400 });
        }

        const parseFullName = (fullName: string) => {
            const parts = fullName.trim().split(' ');
            if (parts.length >= 2) {
                const surname = parts.pop() || '';
                const name = parts.join(' ');
                return { name, surname };
            }
            return { name: fullName, surname: '' };
        };

        const parent1NameParts = parseFullName(application.parentName);
        const password1 = generatePassword();
        const hashedPassword1 = await hashPassword(password1);

        const existingParent1 = await prisma.user.findUnique({
            where: { email: application.parentEmail },
        });

        let parent1Id: string;
        let parent1Created = false;

        if (existingParent1) {
            parent1Id = existingParent1.id;
        } else {
            const parent1 = await prisma.user.create({
                data: {
                    email: application.parentEmail,
                    password: hashedPassword1,
                    name: parent1NameParts.name,
                    surname: parent1NameParts.surname,
                    phone: application.parentPhone,
                    role: "PARENT",
                },
            });
            parent1Id = parent1.id;
            parent1Created = true;
        }

        let parent2Created = false;
        let password2: string | null = null;

        if (application.parent2Email && application.parent2Name) {
            const existingParent2 = await prisma.user.findUnique({
                where: { email: application.parent2Email },
            });

            if (!existingParent2) {
                const parent2NameParts = parseFullName(application.parent2Name);
                password2 = generatePassword();
                const hashedPassword2 = await hashPassword(password2);

                await prisma.user.create({
                    data: {
                        email: application.parent2Email,
                        password: hashedPassword2,
                        name: parent2NameParts.name,
                        surname: parent2NameParts.surname,
                        phone: application.parent2Phone,
                        role: "PARENT",
                    },
                });
                parent2Created = true;
            }
        }

        const child = await prisma.child.create({
            data: {
                name: application.childName,
                surname: application.childSurname,
                age: application.childAge,
                parentId: parent1Id,
                hasImageConsent: false,
                hasDataConsent: false,
            },
        });

        await prisma.recruitmentApplication.update({
            where: { id },
            data: {
                status: "ACCEPTED",
                childId: child.id,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Rekrutacja zakończona pomyślnie",
            child: {
                id: child.id,
                name: child.name,
                surname: child.surname,
            },
            parent1: {
                email: application.parentEmail,
                password: parent1Created ? password1 : null,
                created: parent1Created,
                message: parent1Created 
                    ? "Konto utworzone" 
                    : "Konto już istnieje - użytkownik może się zalogować istniejącymi danymi",
            },
            parent2: application.parent2Email ? {
                email: application.parent2Email,
                password: parent2Created ? password2 : null,
                created: parent2Created,
                message: parent2Created 
                    ? "Konto utworzone" 
                    : "Konto już istnieje - użytkownik może się zalogować istniejącymi danymi",
            } : null,
        });
    }
    catch (error) {
        console.error('PUT /api/recruitment/[id]:', error);
        return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

        const { id } = await params;
        const recruitmentApplication = await prisma.recruitmentApplication.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, deleted: recruitmentApplication.id });
    }
    catch (error) {
        console.error('DELETE /api/recruitment/[id]:', error);
        return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
    }
}
