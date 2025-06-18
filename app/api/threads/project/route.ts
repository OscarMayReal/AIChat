import { auth } from "@/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/app/generated/prisma";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    const threads = await prisma.thread.findMany({
        where: {
            projectId: request.nextUrl.searchParams.get("projectId")!,
            OR: [
                {
                    organizationId: user.session.activeOrganizationId,
                },
                {
                    ownerId: user.user.id,
                },
            ],
        },
    })
    return new Response(JSON.stringify(threads), {
        headers: { "Content-Type": "application/json" },
    })
}
