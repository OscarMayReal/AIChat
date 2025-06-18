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

// Helper function to handle both PUT and PATCH requests
async function handleProjectUpdate(request: Request, isPatch = false) {
    const user = await auth.api.getSession({ headers: await headers() });
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id') || '';
        const body = await request.json();
        const { name, description } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: "Project ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Find the project first to check permissions
        const project = await prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            return new Response(JSON.stringify({ error: "Project not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Check permissions
        const hasPermission = project.ownerId === user.user.id || 
                            project.organizationId === user.session.activeOrganizationId;
        
        if (!hasPermission) {
            return new Response(JSON.stringify({ error: "You don't have permission to update this project" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Prepare update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;

        // For PATCH, only update provided fields
        // For PUT, update all fields (handled by the client sending all fields)
        const updatedProject = await prisma.project.update({
            where: { id },
            data: updateData,
        });

        return new Response(JSON.stringify(updatedProject), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error('Error updating project:', error);
        return new Response(JSON.stringify({ 
            error: "Failed to update project",
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function PUT(request: Request) {
    return handleProjectUpdate(request, false);
}

export async function PATCH(request: Request) {
    return handleProjectUpdate(request, true);
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

    
    