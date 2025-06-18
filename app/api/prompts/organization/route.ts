import { auth } from "@/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user || !user.session.activeOrganizationId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    const prompts = await prisma.prompt.findMany({
        where: {
            organizationId: user.session.activeOrganizationId,
            organizationPublic: true,
            projectId: null,
        },
    })
    return new Response(JSON.stringify(prompts), {
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
    const { name, description, content } = await request.json();
    const prompt = await prisma.prompt.create({
        data: {
            name,
            description,
            content,
            ownerId: user.user.id,
            organizationId: user.session.activeOrganizationId,
            lastEditedBy: user.user.id,
            organizationPublic: true,
        },
    })
    return new Response(JSON.stringify(prompt), {
        headers: { "Content-Type": "application/json" },
    })
}

