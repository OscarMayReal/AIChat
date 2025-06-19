import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { toolId, threadId, input, messageId } = await req.json();

    if (!toolId || !threadId || !input) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify the user has access to the tool and thread
    const [tool, thread] = await Promise.all([
      prisma.tool.findUnique({
        where: {
          id: toolId,
          OR: [
            { ownerId: userId },
            { organizationId: orgId, organizationPublic: true },
          ],
        },
      }),
      prisma.thread.findUnique({
        where: {
          id: threadId,
          OR: [
            { ownerId: userId },
            { organizationId: orgId, organizationPublic: true },
          ],
        },
      }),
    ]);

    if (!tool) {
      return new NextResponse("Tool not found", { status: 404 });
    }

    if (!thread) {
      return new NextResponse("Thread not found", { status: 404 });
    }

    // Create a tool execution record
    const execution = await prisma.toolExecution.create({
      data: {
        toolId: tool.id,
        threadId: thread.id,
        input,
        status: "pending",
        messageId: messageId || null,
      },
    });

    // Execute the tool in a non-blocking way
    executeTool(tool, execution.id, input, messageId);

    return NextResponse.json(execution);
  } catch (error) {
    console.error("[TOOL_EXECUTE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

async function executeTool(tool: any, executionId: string, input: any, messageId?: string) {
  try {
    // Create a function from the tool's code
    const toolFunction = new Function('input', tool.code);
    
    // Execute the tool
    const result = await toolFunction(input);
    
    // Update the execution record with the result
    await prisma.toolExecution.update({
      where: { id: executionId },
      data: {
        output: JSON.stringify(result),
        status: "completed",
        updatedAt: new Date(),
      },
    });
    
    return result;
  } catch (error) {
    console.error("[TOOL_EXECUTION_ERROR]", error);
    
    // Update the execution record with the error
    await prisma.toolExecution.update({
      where: { id: executionId },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        updatedAt: new Date(),
      },
    });
    
    throw error;
  }
}

// Get the status of a tool execution
export async function GET(req: Request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const executionId = searchParams.get("executionId");
    const threadId = searchParams.get("threadId");

    if (!executionId || !threadId) {
      return new NextResponse("Missing executionId or threadId", { status: 400 });
    }

    const execution = await prisma.toolExecution.findUnique({
      where: { id: executionId },
      include: {
        tool: true,
      },
    });

    if (!execution) {
      return new NextResponse("Execution not found", { status: 404 });
    }

    // Verify the user has access to this execution
    if (execution.threadId !== threadId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Verify the user has access to the thread
    const thread = await prisma.thread.findUnique({
      where: {
        id: threadId,
        OR: [
          { ownerId: userId },
          { organizationId: orgId, organizationPublic: true },
        ],
      },
    });

    if (!thread) {
      return new NextResponse("Thread not found", { status: 404 });
    }

    return NextResponse.json(execution);
  } catch (error) {
    console.error("[TOOL_EXECUTION_STATUS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
