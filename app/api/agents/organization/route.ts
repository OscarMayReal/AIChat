import { PrismaClient } from "@/app/generated/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";


const prisma = new PrismaClient();

export async function GET(request: Request) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user || !user.session.activeOrganizationId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    const agents = await prisma.agent.findMany({
        where: {
            organizationId: user.session.activeOrganizationId,
            ownerId: user.session.userId,
            organizationPublic: true
        },
        orderBy: {
            createdAt: "desc",
        },
    })
    return new Response(JSON.stringify(agents), {
        headers: { "Content-Type": "application/json" },
    })
}

export async function POST(request: Request) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user || !user.session.activeOrganizationId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    const { name, systemPrompt } = await request.json();
    const agent = await prisma.agent.create({
        data: {
            name,
            systemPrompt,
            ownerId: user.session.userId,
            organizationId: user.session.activeOrganizationId,
            organizationPublic: true,
        },
    })
    return new Response(JSON.stringify(agent), {
        headers: { "Content-Type": "application/json" },
    })
}