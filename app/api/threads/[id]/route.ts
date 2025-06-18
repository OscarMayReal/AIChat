import { auth } from "@/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/app/generated/prisma";
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Helper function to extract thread ID from URL
function getThreadIdFromUrl(url: string): string | null {
    const parts = url.split('/');
    return parts[parts.length - 1] || null;
}

export async function GET(request: Request) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        })
    }
    const thread = await prisma.thread.findUnique({
        where: {
            id: request.url.split("/").pop()!,
        },
        include: {
            messages: true,
            project: true,
        },
    })
    return new Response(JSON.stringify(thread), {
        headers: { "Content-Type": "application/json" },
    })
}

export async function PATCH(request: Request) {
    console.log('[PATCH /api/threads/[id]] Request received');
    
    try {
        // Authenticate user
        const user = await auth.api.getSession({ headers: await headers() });
        if (!user) {
            console.log('[PATCH /api/threads/[id]] Unauthorized');
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Get thread ID from URL
        const threadId = getThreadIdFromUrl(request.url);
        if (!threadId) {
            console.error('[PATCH /api/threads/[id]] Missing thread ID');
            return NextResponse.json(
                { error: "Thread ID is required" },
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Parse request body
        let updateData;
        try {
            updateData = await request.json();
            if (!updateData.name || typeof updateData.name !== 'string') {
                throw new Error('Name is required and must be a string');
            }
        } catch (error) {
            console.error('[PATCH /api/threads/[id]] Invalid request body:', error);
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log(`[PATCH /api/threads/[id]] Updating thread ${threadId} with:`, updateData);

        // Update thread in database
        const updatedThread = await prisma.thread.update({
            where: { id: threadId },
            data: updateData,
        });

        console.log(`[PATCH /api/threads/[id]] Thread ${threadId} updated successfully`);
        return NextResponse.json(updatedThread, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: unknown) {
        console.error('[PATCH /api/threads/[id]] Error:', error);
        
        // Handle Prisma errors
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') { // Record not found
            return NextResponse.json(
                { error: "Thread not found" },
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }
        
        return NextResponse.json(
            { 
                error: "Failed to update thread",
                details: error instanceof Error ? error.message : 'Unknown error' 
            },
            { 
                status: 500,
                headers: { "Content-Type": "application/json" } 
            }
        );
    }
}

export async function DELETE(request: Request) {
    console.log('[DELETE /api/threads/[id]] Request received');
    
    try {
        // Authenticate user
        const user = await auth.api.getSession({ headers: await headers() });
        if (!user) {
            console.log('[DELETE /api/threads/[id]] Unauthorized');
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Get thread ID from URL
        const threadId = getThreadIdFromUrl(request.url);
        if (!threadId) {
            console.error('[DELETE /api/threads/[id]] Missing thread ID');
            return NextResponse.json(
                { error: "Thread ID is required" },
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log(`[DELETE /api/threads/[id]] Processing delete for thread ${threadId}`);

        // Check if thread exists and user has permission
        const thread = await prisma.thread.findUnique({
            where: { id: threadId },
            select: { ownerId: true }
        });

        if (!thread) {
            console.log(`[DELETE /api/threads/[id]] Thread ${threadId} not found`);
            return NextResponse.json(
                { error: "Thread not found" },
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        if (thread.ownerId !== user.user.id) {
            console.log(`[DELETE /api/threads/[id]] Forbidden: User ${user.user.id} does not own thread ${threadId}`);
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        // Delete the thread
        console.log(`[DELETE /api/threads/[id]] Deleting thread ${threadId}...`);
        await prisma.thread.delete({ where: { id: threadId } });
        
        console.log(`[DELETE /api/threads/[id]] Thread ${threadId} deleted successfully`);
        return NextResponse.json(
            { success: true },
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error: unknown) {
        console.error('[DELETE /api/threads/[id]] Error:', error);
        
        // Handle specific errors
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') { // Record not found
            return NextResponse.json(
                { error: "Thread not found" },
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }
        
        return NextResponse.json(
            { 
                error: "Failed to delete thread",
                details: error instanceof Error ? error.message : "Unknown error" 
            },
            { 
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}