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
    const thread = await prisma.thread.findUnique({
        where: {
            id: request.url.split("/").pop()!,
        },
        include: {
            messages: true,
        },
    })
    return new Response(JSON.stringify(thread), {
        headers: { "Content-Type": "application/json" },
    })
}
    