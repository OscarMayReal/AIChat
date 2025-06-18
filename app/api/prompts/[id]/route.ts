import { auth } from "@/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    const { id } = await request.json();
    const prompt = await prisma.prompt.findUnique({
        where: {
            id,
            OR: [
                {
                    organizationId: user.session.activeOrganizationId,
                    organizationPublic: true,
                },
                {
                    ownerId: user.user.id,
                },
                {
                    projectId: {
                        not: null,
                    },
                    OR: [
                        {
                            organizationId: user.session.activeOrganizationId,
                            organizationPublic: true,
                        },
                        {
                            project: {
                                ownerId: user.user.id,
                            },
                        },
                    ],
                }
            ],
        },
    })
    return new Response(JSON.stringify(prompt), {
        headers: { "Content-Type": "application/json" },
    })
}

export async function PUT(request: Request) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    const { id, name, description, content } = await request.json();
    const prompt = await prisma.prompt.update({
        where: {
            id,
            OR: [
                {
                    organizationId: user.session.activeOrganizationId,
                    organizationPublic: true,
                },
                {
                    ownerId: user.user.id,
                },
                {
                    projectId: {
                        not: null,
                    },
                    OR: [
                        {
                            organizationId: user.session.activeOrganizationId,
                            organizationPublic: true,
                        },
                        {
                            project: {
                                ownerId: user.user.id,
                            },
                        },
                    ],
                }
            ],
        },
        data: {
            name,
            description,
            content,
            lastEditedBy: user.user.id,
            updatedAt: new Date(),
        },
    })
    return new Response(JSON.stringify(prompt), {
        headers: { "Content-Type": "application/json" },
    })
}
