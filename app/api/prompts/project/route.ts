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
    const projectId = request.nextUrl.searchParams.get("projectId");
    const prompts = await prisma.prompt.findMany({
        where: {
            ownerId: user.user.id,
            organizationId: user.session.activeOrganizationId,
            projectId: projectId,
        },
    })
    return new Response(JSON.stringify(prompts), {
        headers: { "Content-Type": "application/json" },
    })
}

export async function POST(request: NextRequest) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user) {
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
            projectId: request.nextUrl.searchParams.get("projectId")!,
        },
    })
    return new Response(JSON.stringify(prompt), {
        headers: { "Content-Type": "application/json" },
    })
}

