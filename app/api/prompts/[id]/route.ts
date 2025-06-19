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

export async function DELETE(request: Request) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    const id = request.url.split("/").pop();
    const getPrompt = await prisma.prompt.findUnique({
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
    if (!getPrompt || (getPrompt.ownerId !== user.user.id && getPrompt.organizationId !== user.session.activeOrganizationId)) {
        return new Response(JSON.stringify({ error: "Prompt not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }
    const prompt = await prisma.prompt.delete({
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
