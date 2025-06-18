import { streamText, type Message } from "ai";
import { google } from "@ai-sdk/google";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { models, type model as ModelType } from "@/lib/models";

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
        // OpenAI models
        'openrouter/openai/gpt-4o',
        'openrouter/openai/gpt-4-turbo',
        // Anthropic models
        'openrouter/anthropic/claude-3-opus',
        'openrouter/anthropic/claude-3-sonnet',
        // Mistral models
        'openrouter/mistralai/mistral-large-latest',
        'openrouter/mistralai/mixtral-8x7b-instruct',
        // Free models
        'openrouter/mistralai/mistral-7b-instruct',
        'openrouter/huggingfaceh4/zephyr-7b-beta',
        'deepseek/deepseek-r1:free'
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
            model: {
                ...model,
                // Don't log the full capabilities to avoid logging sensitive data
                capabilities: model.capabilities ? '[...]' : undefined
            },
            capabilities: capabilities ? '[...]' : 'none',
            messageCount: messages.length,
            lastMessage: messages[messages.length - 1]?.content
        });
        
        // Log model capabilities in a safe way
        if (model.capabilities) {
            console.log('Model capabilities:', model.capabilities.map((cap: any) => ({
                name: cap.name,
                type: cap.type,
                hasValue: !!cap.value
            })));
        }

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
        
        // Check for required API key in capabilities for OpenRouter (only for models that require it)
        if (model.provider === 'openrouter') {
            const modelConfig = models.find((m: ModelType) => m.name === model.name);
            if (modelConfig?.requiresApiKey) {
                // First check in the model's capabilities
                let apiKey = model.capabilities?.find((cap: Capability) => cap.name === 'apiKey')?.value;
                
                // If not found, check in the root capabilities array
                if (!apiKey) {
                    apiKey = capabilities.find((cap: any) => cap.name === 'apiKey')?.value;
                }
                
                if (!apiKey) {
                    throw new Error('API key is required for this OpenRouter model');
                }
                
                // Store the API key in the model object for later use
                model.apiKey = apiKey;
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
            // Get all API keys from model capabilities and root capabilities
            const allApiKeys = [
                ...(model.capabilities || []).filter((cap: Capability) => cap.name === 'apiKey' && cap.value),
                ...(capabilities || []).filter((cap: Capability) => cap.name === 'apiKey' && cap.value)
            ];
            
            // Get the first valid API key
            const apiKey = allApiKeys[0]?.value;
            
            console.log('Found API keys:', {
                modelKeys: (model.capabilities || []).filter((c: any) => c.name === 'apiKey').length,
                rootKeys: (capabilities || []).filter((c: any) => c.name === 'apiKey').length,
                validKeys: allApiKeys.length,
                firstKey: apiKey ? '***' + apiKey.slice(-4) : 'none'
            });
            
            console.log(`Initializing OpenRouter model: ${model.name}`, { 
                hasApiKey: !!apiKey,
                modelCapabilities: model.capabilities,
                rootCapabilities: capabilities
            });
            
            if (!apiKey) {
                throw new Error('API key is required for OpenRouter models. Please provide an API key in the model settings.');
            }

            // Make a direct fetch to OpenRouter API
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://your-site-url.com',
                    'X-Title': 'Your App Name'
                },
                body: JSON.stringify({
                    model: model.name,
                    messages: messages.map(({ role, content }: { role: string; content: string }) => ({
                        role: role as 'user' | 'assistant' | 'system',
                        content: content
                    })),
                    stream: true
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('OpenRouter API error:', error);
                throw new Error(`OpenRouter API error: ${error}`);
            }

            if (!response.body) {
                throw new Error('No response body from OpenRouter');
            }

            // Create a new ReadableStream to process the response
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            let buffer = '';
            let messageCount = 0;
            
            const stream = new ReadableStream({
                async start(controller) {
                    console.log('Starting stream processing for OpenRouter response');
                    const reader = response.body!.getReader();
                    
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            console.log('Read chunk from OpenRouter:', { done, value: value ? '[...]' : 'undefined' });
                            
                            if (done) {
                                console.log('OpenRouter stream ended');
                                break;
                            }
                            
                            // Process the chunk
                            const chunk = decoder.decode(value, { stream: true });
                            console.log('Decoded chunk:', chunk);
                            buffer += chunk;
                            
                            // Process complete SSE messages
                            const lines = buffer.split('\n\n');
                            buffer = lines.pop() || '';
                            
                            console.log(`Processing ${lines.length} complete SSE messages`);
                            
                            for (const line of lines) {
                                console.log('Processing line:', line);
                                
                                if (line.trim() === 'data: [DONE]') {
                                    console.log('Received [DONE] signal');
                                    controller.close();
                                    return;
                                }
                                
                                if (line.startsWith('data: ')) {
                                    try {
                                        const jsonStr = line.slice(6);
                                        console.log('Parsing JSON:', jsonStr);
                                        const data = JSON.parse(jsonStr);
                                        
                                        if (data.choices?.[0]?.delta?.content) {
                                            messageCount++;
                                            const content = data.choices[0].delta.content;
                                            console.log(`Sending content chunk ${messageCount}:`, content);
                                            
                                            const chunkData = {
                                                id: data.id || `chatcmpl-${Date.now()}-${messageCount}`,
                                                object: 'chat.completion.chunk',
                                                created: Math.floor(Date.now() / 1000),
                                                model: model.name,
                                                choices: [{
                                                    index: 0,
                                                    delta: { content },
                                                    finish_reason: null
                                                }]
                                            };
                                            
                                            controller.enqueue(
                                                encoder.encode(`data: ${JSON.stringify(chunkData)}\n\n`)
                                            );
                                        } else {
                                            console.log('No content in delta, skipping');
                                        }
                                    } catch (e) {
                                        console.error('Error parsing SSE message:', e, 'Line:', line);
                                    }
                                }
                            }
                        }
                        
                        if (buffer) {
                            console.log('Processing remaining buffer:', buffer);
                            controller.enqueue(encoder.encode(`data: ${buffer}\n\n`));
                        }
                        
                        console.log('Closing controller, total messages processed:', messageCount);
                        controller.close();
                    } catch (error) {
                        console.error('Stream error:', error);
                        controller.error(error);
                    }
                }
            });
            
            console.log('Created ReadableStream with response processing logic');

            // Return the transformed stream
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no',
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
