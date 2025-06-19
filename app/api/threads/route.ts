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
        orderBy: {
            updatedAt: "desc",
        },
    })
    return new Response(JSON.stringify(threads), {
        headers: { "Content-Type": "application/json" },
    })
}

export async function POST(request: Request) {
    const user = await auth.api.getSession({headers: await headers()});
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const { name } = await request.json();
    
    try {
        const threadData: any = {
            name,
            ownerId: user.session.userId,
            organizationId: user.session.activeOrganizationId,
        };
        
        // If projectId is provided, associate the thread with the project
        if (projectId) {
            // Verify the project exists and belongs to the user's organization
            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                    organizationId: user.session.activeOrganizationId,
                },
            });
            
            if (!project) {
                return new Response(JSON.stringify({ error: "Project not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                });
            }
            
            threadData.projectId = projectId;
        }
        
        const thread = await prisma.thread.create({
            data: threadData,
            include: {
                project: true
            }
        });
        
        return new Response(JSON.stringify(thread), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error('Error creating thread:', error);
        return new Response(JSON.stringify({ 
            error: "Failed to create thread",
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
