import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: Request) {
    const { messages } = await request.json();

    const model = google("gemini-2.0-flash-lite", { useSearchGrounding: true });

    const stream = streamText({ model, messages });

    return stream.toDataStreamResponse();
}
