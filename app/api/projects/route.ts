import { auth } from "@/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

async function getAuthUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
        return null;
    }
    return {
        id: session.user.id,
        activeOrganizationId: session.session.activeOrganizationId
    };
}

export async function GET(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    {
                        ownerId: user.id,
                        organizationId: user.activeOrganizationId || undefined,
                    },
                    {
                        organizationId: user.activeOrganizationId || undefined,
                    },
                ],
            },
        });

        return Response.json(projects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        return Response.json(
            { error: "Failed to fetch projects" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description } = await request.json();
        
        if (!name) {
            return Response.json(
                { error: "Project name is required" },
                { status: 400 }
            );
        }

        const project = await prisma.project.create({
            data: {
                name,
                description: description || "",
                ownerId: user.id,
                organizationId: user.activeOrganizationId || null,
            },
        });

        return Response.json(project, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return Response.json(
            { error: "Failed to create project" },
            { status: 500 }
        );
    }
}

