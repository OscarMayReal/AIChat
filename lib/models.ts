import { SearchIcon, KeyIcon, HammerIcon } from "lucide-react";

export const models = [
    // {
    //     name: "gpt-4o",
    //     label: "GPT 4o",
    //     description: "A powerful, general-purpose language model.",
    //     provider: "openai",
    //     capabilities: [
            
    //     ]
    // },
    // {
    //     name: "gpt-4o-mini",
    //     label: "GPT 4o Mini",
    //     description: "A smaller, faster version of GPT 4o.",
    //     provider: "openai",
    //     capabilities: [
            
    //     ]
    // },
    {
        name: "gemini-2.0-flash",
        label: "Gemini 2.0 Flash",
        description: "Google's fastest and most efficient model, optimized for speed and general-purpose tasks with excellent reasoning capabilities.",
        provider: "google",
        capabilities: [
            {
                name: "useSearchGrounding",
                description: "Use search grounding to provide context to the model.",
                type: "boolean",
                defaultValue: false,
                friendlyName: "Search",
                icon: SearchIcon,
            }
        ]
    },
    {
        name: "gemini-2.0-flash-lite",
        label: "Gemini 2.0 Flash Lite (For Tools)",
        description: "Google's fastest and most efficient model, optimized for speed and general-purpose tasks with excellent reasoning capabilities.",
        provider: "google",
        capabilities: [
            {
                name: "useTools",
                description: "Use tools to provide context to the model.",
                type: "boolean",
                defaultValue: true,
                friendlyName: "Tools",
                icon: HammerIcon,
            }
        ]
    },
    {
        name: "gemma-3-27b-it",
        label: "Gemma 3 27B IT",
        description: "A lightweight, state-of-the-art open model from Google, optimized for efficiency and performance on a wide range of tasks.",
        provider: "google",
        capabilities: []
    },
    // OpenAI Models (via OpenRouter)
    {
        name: "openrouter/openai/gpt-4o",
        label: "GPT-4o (via OpenRouter)",
        description: "OpenAI's most advanced model, faster and more capable than GPT-4 Turbo.",
        provider: "openrouter",
        requiresApiKey: true,
        capabilities: [
            {
                name: "apiKey",
                description: "Your OpenRouter API key",
                type: "password",
                required: true,
                friendlyName: "API Key",
                icon: KeyIcon
            }
        ]
    },
    {
        name: "openrouter/openai/gpt-4-turbo",
        label: "GPT-4 Turbo (via OpenRouter)",
        description: "OpenAI's powerful model with knowledge up to 2023.",
        provider: "openrouter",
        requiresApiKey: true,
        capabilities: [
            {
                name: "apiKey",
                description: "Your OpenRouter API key",
                type: "password",
                required: true,
                friendlyName: "API Key",
                icon: KeyIcon
            }
        ]
    },
    // Anthropic Models (via OpenRouter)
    {
        name: "openrouter/anthropic/claude-3-opus",
        label: "Claude 3 Opus (via OpenRouter)",
        description: "Anthropic's most capable model, excelling at complex reasoning.",
        provider: "openrouter",
        requiresApiKey: true,
        capabilities: [
            {
                name: "apiKey",
                description: "Your OpenRouter API key",
                type: "password",
                required: true,
                friendlyName: "API Key",
                icon: KeyIcon
            }
        ]
    },
    {
        name: "openrouter/anthropic/claude-3-sonnet",
        label: "Claude 3 Sonnet (via OpenRouter)",
        description: "Anthropic's balanced model between capability and speed.",
        provider: "openrouter",
        requiresApiKey: true,
        capabilities: [
            {
                name: "apiKey",
                description: "Your OpenRouter API key",
                type: "password",
                required: true,
                friendlyName: "API Key",
                icon: KeyIcon
            }
        ]
    },
    // Mistral Models (via OpenRouter)
    {
        name: "openrouter/mistralai/mistral-large-latest",
        label: "Mistral Large (via OpenRouter)",
        description: "Mistral's most capable model, great for complex tasks.",
        provider: "openrouter",
        requiresApiKey: true,
        capabilities: [
            {
                name: "apiKey",
                description: "Your OpenRouter API key",
                type: "password",
                required: true,
                friendlyName: "API Key",
                icon: KeyIcon
            }
        ]
    },
    {
        name: "openrouter/mistralai/mixtral-8x7b-instruct",
        label: "Mixtral 8x7B (via OpenRouter)",
        description: "High-quality mixture of experts model from Mistral AI.",
        provider: "openrouter",
        requiresApiKey: true,
        capabilities: [
            {
                name: "apiKey",
                description: "Your OpenRouter API key",
                type: "password",
                required: true,
                friendlyName: "API Key",
                icon: KeyIcon
            }
        ]
    },
    // Free Models (via OpenRouter) - Still require API key for authentication
    {
        name: "openrouter/mistralai/mistral-7b-instruct",
        label: "Mistral 7B (via OpenRouter)",
        description: "Efficient and capable open model from Mistral AI. Free to use but requires OpenRouter API key.",
        provider: "openrouter",
        requiresApiKey: true,
        capabilities: [
            {
                name: "apiKey",
                description: "Your OpenRouter API key",
                type: "password",
                required: true,
                friendlyName: "API Key",
                icon: KeyIcon
            }
        ]
    },
    {
        name: "openrouter/huggingfaceh4/zephyr-7b-beta",
        label: "Zephyr 7B Beta (via OpenRouter)",
        description: "A fine-tuned version of Mistral-7B, optimized for chat. Free to use but requires OpenRouter API key.",
        provider: "openrouter",
        requiresApiKey: true,
        capabilities: [
            {
                name: "apiKey",
                description: "Your OpenRouter API key",
                type: "password",
                required: true,
                friendlyName: "API Key",
                icon: KeyIcon
            }
        ]
    },
    {
        name: "deepseek/deepseek-r1:free",
        label: "DeepSeek R1 (via OpenRouter)",
        description: "DeepSeek's advanced model, optimized for coding and general tasks. Free to use but requires OpenRouter API key.",
        provider: "openrouter",
        requiresApiKey: true,
        capabilities: [
            {
                name: "apiKey",
                description: "Your OpenRouter API key",
                type: "password",
                required: true,
                friendlyName: "API Key",
                icon: KeyIcon
            }
        ]
    },
]

export interface capability {
    name: string;
    description: string;
    type: string;
    defaultValue?: any;
    value?: boolean | string | undefined;
    required?: boolean;
    friendlyName?: string;
    icon?: any;
}

export interface model {
    name: string;
    label: string;
    description: string;
    provider: string;
    requiresApiKey?: boolean;
    capabilities: capability[];
};