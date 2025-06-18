import { auth } from "@/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/app/generated/prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const user = await auth.api.getSession({headers: await headers()});
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const threadId = request.nextUrl.searchParams.get("threadId");
        if (!threadId) {
            return new Response(JSON.stringify({ error: "Thread ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get the thread with its messages ordered by creation time
        const thread = await prisma.thread.findUnique({
            where: { id: threadId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    where: { role: 'user' },
                    take: 5 // Only use the first few user messages for context
                }
            },
        });

        if (!thread) {
            return new Response(JSON.stringify({ error: "Thread not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // If no messages yet, return a default name
        if (thread.messages.length === 0) {
            return new Response(JSON.stringify({ name: "New Chat" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get the most recent user message (or first one if only one exists)
        const messageToUse = thread.messages[thread.messages.length - 1];
        
        // Generate a title using AI
        const name = await generateText({
            model: google("gemini-1.5-flash"),
            messages: [{
                role: "user",
                content: `Generate a short, descriptive title (2-4 words) for this chat message. 
                The title should be concise and capture the main topic. 
                Do not use quotes, periods, or other punctuation.
                
                Message: ${messageToUse.text.substring(0, 500)}`,
            }],
            maxTokens: 30,
            temperature: 0.7,
        });

        // Clean up the generated title
        let cleanTitle = name.text
            .replace(/["'.!?]/g, '') // Remove punctuation
            .replace(/\n/g, ' ') // Remove newlines
            .trim()
            .split(' ')
            .filter(word => word.length > 0)
            .slice(0, 5) // Limit to 5 words max
            .join(' ');

        // If we somehow got an empty title, use a fallback
        if (!cleanTitle) {
            cleanTitle = `Chat ${new Date().toLocaleDateString()}`;
        }

        // Update the thread with the new name
        await prisma.thread.update({
            where: { id: thread.id },
            data: { name: cleanTitle },
        });

        return new Response(JSON.stringify({ name: cleanTitle }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error generating thread title:", error);
        return new Response(
            JSON.stringify({ 
                error: "Failed to generate title",
                details: error instanceof Error ? error.message : 'Unknown error' 
            }), 
            { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            }
        );
    }
}