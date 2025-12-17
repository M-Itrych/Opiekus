import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOrCreateDailyPickupCode } from "@/lib/pickup-code";
import { QrCode } from "lucide-react";

async function getSessionUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    return payload;
}

export default async function PickupCodeDisplay() {
    const user = await getSessionUser();

    if (!user || user.role !== "PARENT") {
        return null;
    }

    const children = await prisma.child.findMany({
        where: { parentId: user.id as string },
        select: { id: true, name: true, surname: true },
    });

    if (children.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">Brak przypisanych dzieci</p>
            </div>
        );
    }

    const firstChild = children[0];
    const pickupCode = await getOrCreateDailyPickupCode(firstChild.id);

    return (
        <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-sky-200 shadow-sm">
            <div className="flex items-center gap-2 text-sky-600">
                <QrCode className="h-5 w-5" />
                <span className="text-sm font-medium">Kod odbioru na dziś</span>
            </div>
            <p className="text-3xl font-bold tracking-widest text-gray-800">
                {pickupCode}
            </p>
            <p className="text-xs text-gray-500">
                {firstChild.name} {firstChild.surname}
            </p>
            <p className="text-xs text-gray-400">
                Ważny do końca dnia
            </p>
        </div>
    );
}
