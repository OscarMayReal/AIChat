import { auth } from "@/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/app/generated/prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    var thread = await prisma.thread.findUnique({
        where: {
            id: request.nextUrl.searchParams.get("threadId")!,
        },
        include: {
            messages: true,
        },
    })
    // console.log(thread)
    if (!thread || thread.messages.length < 2 || thread.messages.length > 2 || thread.name !== "New Chat") {
        return new Response(JSON.stringify({ error: "Thread not found or not New Chat" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }
    const name = await generateText({
        model: google("gemma-3-12b-it"),
        messages: [{
            role: "user",
            content: `You are a thread title generator. Summarize the message in a short, catchy title (3-5 words). No punctuation. No markdown.
            
            Message: ${thread.messages[0].text}`,
        }],
    })
    await prisma.thread.update({
        where: {
            id: thread.id,
        },
        data: {
            name: name.text,
        },
    })
    return new Response(JSON.stringify({ name: name.text }), {
        headers: { "Content-Type": "application/json" },
    })
}