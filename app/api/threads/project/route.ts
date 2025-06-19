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
    const projectId = request.nextUrl.searchParams.get("projectId")!;
    //console.log(projectId);
    const threads = await prisma.thread.findMany({
        where: {
            projectId: projectId,
            OR: [
                {
                    organizationId: {
                        equals: user.session.activeOrganizationId,
                        not: null,
                    },
                },
                {
                    ownerId: user.user.id,
                },
            ],
        },
        orderBy: {
            updatedAt: "desc",
        },
    })
    return new Response(JSON.stringify(threads), {
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
    const projectId = request.nextUrl.searchParams.get("projectId")!;
    const { name } = await request.json();
    const thread = await prisma.thread.create({
        data: {
            name,
            projectId,
            ownerId: user.user.id,
            organizationId: user.session.activeOrganizationId,
        },
    })
    return new Response(JSON.stringify(thread), {
        headers: { "Content-Type": "application/json" },
    })
}

