import { prisma } from "@/lib/prisma";

function generatePickupCode(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

/**
 * Zwraca datę dzisiejszą z wyzerowaną godziną (Y-M-D 00:00:00)
 */
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

/**
 * Generuje kody dla wszystkich dzieci, które jeszcze go nie mają na dziś
 */
export async function generateAllMissingPickupCodes(): Promise<number> {
    const today = getTodayDate();
    const children = await prisma.child.findMany({
        select: { id: true }
    });

    let generatedCount = 0;

    for (const child of children) {
        const existing = await prisma.dailyPickupCode.findUnique({
            where: {
                childId_date: {
                    childId: child.id,
                    date: today
                }
            }
        });

        if (!existing) {
            await prisma.dailyPickupCode.create({
                data: {
                    childId: child.id,
                    code: generatePickupCode(),
                    date: today
                }
            });
            generatedCount++;
        }
    }

    return generatedCount;
}
