import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ToolUpdateData {
  name?: string;
  description?: string;
  code?: string;
  parameters?: any;
  organizationPublic?: boolean;
}

export async function GET(
  req: Request,
  { params }: { params: { toolId: string } }
) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tool = await prisma.tool.findUnique({
      where: {
        id: params.toolId,
        OR: [
          { ownerId: userId },
          { organizationId: orgId, organizationPublic: true },
        ],
      },
    });

    if (!tool) {
      return new NextResponse("Tool not found", { status: 404 });
    }

    return NextResponse.json(tool);
  } catch (error) {
    console.error("[TOOL_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { toolId: string } }
) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, description, code, parameters, organizationPublic } = body as ToolUpdateData;

    const tool = await prisma.tool.findUnique({
      where: { id: params.toolId },
    });

    if (!tool) {
      return new NextResponse("Tool not found", { status: 404 });
    }

    if (tool.ownerId !== userId && (tool.organizationId !== orgId || !orgId)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedTool = await prisma.tool.update({
      where: { id: params.toolId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(code && { code }),
        ...(parameters && { parameters }),
        ...(organizationPublic !== undefined && { organizationPublic }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedTool);
  } catch (error) {
    console.error("[TOOL_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { toolId: string } }
) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tool = await prisma.tool.findUnique({
      where: { id: params.toolId },
    });

    if (!tool) {
      return new NextResponse("Tool not found", { status: 404 });
    }

    if (tool.ownerId !== userId && (tool.organizationId !== orgId || !orgId)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.tool.delete({
      where: { id: params.toolId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TOOL_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
