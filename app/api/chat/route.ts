import { streamText, type Message } from "ai";
import { google } from "@ai-sdk/google";

type Capability = {
    name: string;
    value: any;
};

// List of supported models by provider
const SUPPORTED_MODELS = {
    google: [
        'gemini-2.0-flash',
        'gemma-3-27b-it'
    ],
    openrouter: [
        'openrouter/auto',
        'openrouter/openai/gpt-4-turbo'
    ]
};

// Helper to validate model support
function isModelSupported(provider: string, modelName: string): boolean {
    return SUPPORTED_MODELS[provider as keyof typeof SUPPORTED_MODELS]?.includes(modelName) || false;
}

export async function POST(request: Request) {
    try {
        console.log('Received chat request');
        const { messages, model, capabilities = [] } = await request.json();
        
        console.log('Request data:', {
            model,
            capabilities,
            messageCount: messages.length,
            lastMessage: messages[messages.length - 1]?.content
        });

        // Validate model provider
        if (!['google', 'openrouter'].includes(model.provider)) {
            throw new Error(`Unsupported model provider: ${model.provider}. Supported providers: google, openrouter`);
        }

        // Validate model is supported by the provider
        if (!isModelSupported(model.provider, model.name)) {
            throw new Error(`Unsupported model for provider ${model.provider}: ${model.name}`);
        }

        // Check for required API keys
        if (model.provider === 'google' && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables');
        }
        
        // Check for required API key in capabilities for OpenRouter
        if (model.provider === 'openrouter') {
            const apiKeyCapability = model.capabilities?.find((cap: Capability) => cap.name === 'apiKey');
            if (!apiKeyCapability?.value) {
                throw new Error('API key is required for OpenRouter models');
            }
        }

        let stream: ReturnType<typeof streamText> | null = null;
        
        if (model.provider === 'google') {
            const useSearchGrounding = capabilities.find((cap: any) => cap.name === "useSearchGrounding")?.value || false;
            console.log(`Initializing Google model: ${model.name}`, { useSearchGrounding });
            
            const aimodel = google(model.name, { 
                useSearchGrounding
            });
            
            stream = streamText({ 
                model: aimodel,
                messages,
                onError: (error) => {
                    console.error('Google stream error:', error);
                }
            });
        } else if (model.provider === 'openrouter') {
            const apiKey = model.capabilities?.find((cap: Capability) => cap.name === 'apiKey')?.value;
            console.log(`Initializing OpenRouter model: ${model.name}`);
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://your-site-url.com', // Replace with your site URL
                    'X-Title': 'Your App Name' // Replace with your app name
                },
                body: JSON.stringify({
                    model: model.name,
                    messages: messages.map(({ role, content }: { role: string; content: string }) => ({
                        role: role === 'user' ? 'user' : 'assistant',
                        content
                    }))
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`OpenRouter API error: ${error.error?.message || 'Unknown error'}`);
            }
            
            // Convert the response to a ReadableStream
            const { readable, writable } = new TransformStream();
            const writer = writable.getWriter();
            
            // Process the response as a stream
            const reader = response.body?.getReader();
            if (!reader) throw new Error('Failed to read response body');
            
            (async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        await writer.write(value);
                    }
                } catch (error) {
                    console.error('Error streaming OpenRouter response:', error);
                } finally {
                    await writer.close();
                }
            })();
            
            return new Response(readable, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Transfer-Encoding': 'chunked'
                }
            });
        }
        
        if (!stream) {
            throw new Error('Failed to initialize model stream');
        }
        
        console.log('Converting to response...');
        const response = stream.toDataStreamResponse();
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        return response;
        
    } catch (error) {
        console.error('Error in chat API:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ 
            error: 'Failed to process chat request',
            details: errorMessage
        }), {
            status: 400,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
        });
    }
}
