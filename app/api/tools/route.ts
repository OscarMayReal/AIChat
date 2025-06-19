import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "prisma";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, description, code, parameters, projectId } = body;

    if (!name || !code) {
      return new NextResponse("Name and code are required", { status: 400 });
    }

    const tool = await prisma.tool.create({
      data: {
        name,
        description: description || "",
        code,
        parameters: parameters || {},
        ownerId: userId,
        organizationId: orgId || null,
        projectId: projectId || null,
        organizationPublic: false,
      },
    });

    return NextResponse.json(tool);
  } catch (error) {
    console.error("[TOOLS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const tools = await prisma.tool.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { organizationId: orgId, organizationPublic: true },
          ...(projectId ? [{ projectId }] : []),
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tools);
  } catch (error) {
    console.error("[TOOLS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
