import { prisma } from "@/lib/prisma";

function generatePickupCode(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

function getTodayDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getOrCreateDailyPickupCode(childId: string): Promise<string> {
    const today = getTodayDate();

    const existingCode = await prisma.dailyPickupCode.findUnique({
        where: {
            childId_date: {
                childId,
                date: today,
            },
        },
    });

    if (existingCode) {
        return existingCode.code;
    }

    const newCode = await prisma.dailyPickupCode.create({
        data: {
            childId,
            code: generatePickupCode(),
            date: today,
        },
    });

    return newCode.code;
}

export async function verifyPickupCode(code: string, childId: string): Promise<boolean> {
    const today = getTodayDate();

    const pickupCode = await prisma.dailyPickupCode.findFirst({
        where: {
            childId,
            code,
            date: today,
            isUsed: false,
        },
    });

    if (!pickupCode) {
        return false;
    }

    await prisma.dailyPickupCode.update({
        where: { id: pickupCode.id },
        data: {
            isUsed: true,
            usedAt: new Date(),
        },
    });

    return true;
}
