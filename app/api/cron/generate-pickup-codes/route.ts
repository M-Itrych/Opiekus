import { NextResponse } from "next/server";
import { generateAllMissingPickupCodes } from "@/lib/pickup-code";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response("Unauthorized", { status: 401 });
        }

        const count = await generateAllMissingPickupCodes();

        return NextResponse.json({
            message: `Generated ${count} new pickup codes.`,
            count
        });
    } catch (error) {
        console.error("Error in cron pickup code generation:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
