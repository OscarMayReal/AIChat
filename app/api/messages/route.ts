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
    const { threadId } = await request.json();
    const messages = await prisma.message.findMany({
        where: {
            threadId,
        },
    })
    return new Response(JSON.stringify(messages), {
        headers: { "Content-Type": "application/json" },
    })
}

export async function POST(request: Request) {
    const user = await auth.api.getSession({headers: await headers()})
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    const { threadId, text, role } = await request.json();
    const message = await prisma.message.create({
        data: {
            threadId,
            text,
            role,
        },
    })
    var thread = await prisma.thread.findUnique({
        where: {
            id: threadId,
        },
    })
    if (thread) {
        thread.updatedAt = new Date();
        await prisma.thread.update({
            where: {
                id: threadId,
            },
            data: thread,
        })
    }
    return new Response(JSON.stringify(message), {
        headers: { "Content-Type": "application/json" },
    })
}
