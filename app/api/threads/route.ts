import { PrismaClient } from "@/app/generated/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";


const prisma = new PrismaClient();

export async function GET(request: Request) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    const threads = await prisma.thread.findMany({
        where: {
            organizationId: user.session.activeOrganizationId,
            ownerId: user.session.userId,
        },
    })
    return new Response(JSON.stringify(threads), {
        headers: { "Content-Type": "application/json" },
    })
}

export async function POST(request: Request) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    const { name } = await request.json();
    const thread = await prisma.thread.create({
        data: {
            name,
            ownerId: user.session.userId,
            organizationId: user.session.activeOrganizationId,
        },
    })
    return new Response(JSON.stringify(thread), {
        headers: { "Content-Type": "application/json" },
    })
}

