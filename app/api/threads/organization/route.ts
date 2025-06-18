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
            organizationId: {
                equals: user.session.activeOrganizationId,
                not: null,
            },
            organizationPublic: true,
        },
    })
    return new Response(JSON.stringify(threads), {
        headers: { "Content-Type": "application/json" },
    })
}
