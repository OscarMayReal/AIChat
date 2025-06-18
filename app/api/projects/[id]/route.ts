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
    const project = await prisma.project.findUnique({
        where: {
            id,
            OR: [
                {
                    ownerId: user.user.id,
                    organizationId: user.session.activeOrganizationId,
                },
                {
                    organizationId: user.session.activeOrganizationId,
                },
            ],
        },
        include: {
            threads: true,
            prompts: true,
        },
    })
    return new Response(JSON.stringify(project), {
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
    const { id, name, description } = await request.json();
    var project = await prisma.project.findUnique({
        where: {
            id,
            OR: [
                {
                    ownerId: user.user.id,
                    organizationId: user.session.activeOrganizationId,
                },
                {
                    organizationId: user.session.activeOrganizationId,
                },
            ],
        },
    })
    if (!project || (project.ownerId !== user.user.id && project.organizationId !== user.session.activeOrganizationId) || (project.organizationId !== user.session.activeOrganizationId && project.organizationId != null)) {
        return new Response(JSON.stringify({ error: "Project not found or you do not have permission to update it" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }
    project = await prisma.project.update({
        where: {
            id,
            OR: [
                {
                    ownerId: user.user.id,
                    organizationId: user.session.activeOrganizationId,
                },
                {
                    organizationId: user.session.activeOrganizationId,
                },
            ],
        },
        data: {
            name,
            description,
        },
    })
    return new Response(JSON.stringify(project), {
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
    const { id } = await request.json();
    var project = await prisma.project.findUnique({
        where: {
            id,
            OR: [
                {
                    ownerId: user.user.id,
                    organizationId: user.session.activeOrganizationId,
                },
                {
                    organizationId: user.session.activeOrganizationId,
                },
            ],
        },
    })
    if (!project || (project.ownerId !== user.user.id && project.organizationId !== user.session.activeOrganizationId) || (project.organizationId !== user.session.activeOrganizationId && project.organizationId != null)) {
        return new Response(JSON.stringify({ error: "Project not found or you do not have permission to delete it" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }
    await prisma.project.delete({
        where: {
            id,
            OR: [
                {
                    ownerId: user.user.id,
                    organizationId: user.session.activeOrganizationId,
                },
                {
                    organizationId: user.session.activeOrganizationId,
                },
            ],
        },
    })
    return new Response(JSON.stringify({}), {
        headers: { "Content-Type": "application/json" },
    })
}

    
    