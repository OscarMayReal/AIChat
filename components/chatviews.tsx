import { useChat } from "@ai-sdk/react";
import * as React from 'react';
import { 
  RotateCw as RotateCwIcon, 
  Send as SendIcon, 
  Library as LibraryIcon, 
  Text as TextIcon, 
  Sparkle as SparkleIcon, 
  Archive as ArchiveIcon, 
  Users as UsersIcon, 
  FolderOpen as FolderOpenIcon, 
  MessageSquare as MessageSquareIcon, 
  MessageSquareLock as MessageSquareLockIcon, 
  MoreVertical as MoreVerticalIcon, 
  Trash2 as Trash2Icon, 
  Share2 as ShareIcon, 
  PenBox as PenBoxIcon, 
  FolderInput as FolderInputIcon, 
  User as UserIcon, 
  Bot as BotIcon, 
  Check as CheckIcon, 
  Key as KeyIcon, 
  Loader2 as Loader2Icon, 
  Pencil as PencilIcon, 
  X as XIcon,
  Plus as PlusIcon,
  MessageSquareMore,
  MessageSquareMoreIcon,
  MessageSquare,
  MessageSquareOffIcon,
  ArchiveRestoreIcon,
  ChevronLeftIcon
} from "lucide-react";
import { Thread as ThreadType } from "@/app/generated/prisma";
import { Button } from "@/components/ui/button";

interface ThreadWithDetails {
  data?: ThreadType[];
  loaded: boolean;
  refresh: () => void;
  openThread: (thread: ThreadType) => void;
}

interface ProjectThreadsResult {
  data?: ThreadType[];
  loaded: boolean;
}

interface ProjectPromptsResult {
  data?: any[];
  loaded: boolean;
  refresh: () => void;
}

import { useMutation, useQuery } from "convex/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle";
import { models, model, capability } from "@/lib/models";
import { ModelSelector } from "@/components/combobox";
import { useEffect, useRef, useState } from "react";
import { Thread, Message, Prompt } from "@/app/generated/prisma";
import { DockviewPanel, DockviewPanelApi } from "dockview-react";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { authClient } from "@/lib/auth-client";
import { OrganizationMembersCard, OrganizationInvitationsCard } from "@daveyplate/better-auth-ui";
import { archiveThread, createProjectThread, deleteThread, moveThreadToOrganization, openArchivedChats, openOrganizationChats, openThread, renameThread, useArchivedThreads, useOrganizationThreads, useProjectThreads, useThreads } from "@/lib/threads";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { createOrganizationPrompt, createPersonalPrompt, openPromptEditor, openPromptsLibrary, updatePrompt, useOrganizationPrompts, usePersonalPrompts, useProjectPrompts } from "@/lib/prompts";
import { openProject, openProjectLibrary, useProjects } from "@/lib/projects";
import { Project } from "@/app/generated/prisma";
import { useInputDialog } from "./ui/input-dialog";

var createMessage = async (message: {text: string, role: string, threadId: string}) => {
    const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
    });
    return await response.json();
}

var getThread = async (threadId: string): Promise<Thread> => {
    const response = await fetch("/api/threads/" + threadId);
    return await response.json();
}

type EmptyChatPlaceholderProps = {
    onPromptSelect?: (text: string) => void;
};

export function EmptyChatPlaceholder({ onPromptSelect }: EmptyChatPlaceholderProps) {
    var session = authClient.useSession()
    const {showDialog} = useInputDialog();
    var personalPrompts = usePersonalPrompts()
    return (
        <div style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
            textAlign: "center",
        }}>
            <div style={{
                fontSize: "30px",
                fontWeight: "500",
                marginBottom: "10px",
            }}>Hello <span style={{ color: "rgb(150, 62, 255)" }}>{session.data?.user?.name}</span>, How can I help you today?</div>
            <div style={{
                fontSize: "15px",
                marginBottom: "25px",
                color: "#999999",
                maxWidth: "600px",
            }}>
                Start a conversation by typing a message below{personalPrompts.data.length > 0 ? ", or select one of your saved prompts" : ""}.
            </div>
            {personalPrompts.data.length > 0 && (
                <div style={{
                    display: "grid",
                    justifyItems: "center",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "15px",
                    width: "100%",
                    maxWidth: "900px",
                    margin: "0 auto",
                }}>
                    {personalPrompts.data.map((prompt: Prompt, index: number) => (
                        index > 6 ? null : (
                        <div 
                            onClick={async () => {
                                prompt.content = await replaceVariablesAsync(prompt.content, showDialog);
                                onPromptSelect?.(prompt.content);
                            }}
                            style={{ width: '100%' }}
                            key={prompt.id}
                        >
                            <LibraryFolderCard 
                                title={prompt.name} 
                                color="#983DEF" 
                                icon={<TextIcon size={16} />} 
                                subtitle={prompt.description || prompt.content.substring(0, 100) + (prompt.content.length > 100 ? '...' : '')}
                                onClick={async () => {
                                    prompt.content = await replaceVariablesAsync(prompt.content, showDialog);
                                    onPromptSelect?.(prompt.content);
                                }}
                            />
                        </div>
                        )
                    ))}
                </div>
            )}
        </div>
    )
}

export function MembersPage() {
    return (
        <div style={{
            padding: "25px",
            height: "100%",
            width: "100%",
        }}>
            <div style={{
                fontSize: "30px",
                fontWeight: "500",
                marginBottom: "25px",
            }}>Organization Members</div>
            <OrganizationMembersCard title=" " />
            <div style={{
                height: "25px",
            }}></div>
            <OrganizationInvitationsCard title=" " />
        </div>
    )
}

export function RegularChat({
    id,
}: {
    id: string;
}) {
    const scrollableDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollableDivRef.current) {
            scrollableDivRef.current.scrollTop = scrollableDivRef.current.scrollHeight;
        }
    }, [])
    var thispanelholder = (window as any).dockViewApi?.panels?.find?.((panel: any) => panel.id === id);
    var thispanel = thispanelholder as DockviewPanel;
    var [model, setModel] = useState<model>(models[0]);
    var [enabledCapabilities, setEnabledCapabilities] = useState<capability[]>([]);
    var [currentProject, setCurrentProject] = useState<Project | null>(null);
    
    const [threadName, setThreadName] = useState<string>("");
    const [initialMessages, setInitialMessages] = useState<{data: Message[], loaded: boolean}>({data: [], loaded: false});
    const showDialog = useInputDialog();
    
    if (!initialMessages.loaded) {
        getThread(id).then(thread => {
            console.log(thread.name);
            setThreadName(thread.name);
            // @ts-ignore - We know thread has messages
            setInitialMessages({data: thread.messages || [], loaded: true});
            // @ts-ignore - We know thread has project
            setCurrentProject(thread.project || null);
        });
    }
    console.log('Initializing useChat with:', {
        model: {
            provider: model.provider,
            name: model.name
        },
        threadId: id,
        initialMessageCount: initialMessages.data.length
    });

    const { messages, input, handleInputChange, handleSubmit } = useChat({
        api: '/api/chat',
        body: {
            capabilities: [
                ...enabledCapabilities,
                ...(model.capabilities || []).map(capability => ({
                    name: capability.name,
                    value: capability.value
                }))
            ],
            model: {
                ...model,
                // Include the full model object with capabilities
                capabilities: model.capabilities?.map(capability => ({
                    name: capability.name,
                    value: capability.value
                })) || []
            },
            threadId: id,
        },
        headers: {
            'Content-Type': 'application/json',
        },
        initialMessages: initialMessages.data.map(message => ({
            id: message.id,
            content: message.text,
            role: message.role as "user" | "assistant",
        })),
        onResponse: async (response) => {
            console.log('Chat API response status:', response.status);
            if (!response.ok) {
                const error = await response.text();
                console.error('Chat API error:', error);
                throw new Error(`Failed to send message: ${error}`);
            }
            console.log('Chat API response headers:', Object.fromEntries([...response.headers.entries()]));
        },
        onFinish: async (message) => {
            console.log('Chat completion finished:', message);
            try {
                // Only save the AI's response, not the user's message
                if (message.role === 'assistant') {
                    await createMessage({
                        text: message.content,
                        role: message.role,
                        threadId: id,
                    });
                }
                setTimeout(() => {
                    scrollableDivRef.current?.scrollTo({
                        top: scrollableDivRef.current.scrollHeight + 250,
                        behavior: 'smooth',
                    });
                }, 200);
            } catch (error) {
                console.error('Failed to save message:', error);
            }
        },
    });

    const handleFormSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;
        
        try {
            // Save the user message first
            await createMessage({
                text: input,
                role: 'user',
                threadId: id,
            });
            // Then trigger the chat submission
            await handleSubmit(e);
            setTimeout(() => {
                scrollableDivRef.current?.scrollTo({
                    top: scrollableDivRef.current.scrollHeight + 250,
                    behavior: 'smooth',
                });
            }, 200);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Generate a title when the first message is sent
    useEffect(() => {
        const shouldGenerateTitle = 
            (threadName === "" || threadName === "New Chat") && 
            messages.length === 1 && 
            messages[0].role === 'user';

        if (shouldGenerateTitle) {
            const generateTitle = async () => {
                try {
                    const response = await fetch(`/api/generatethreadname?threadId=${id}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    
                    if (data.name) {
                        setThreadName(data.name);
                        
                        // Update the panel title in the UI
                        (window as any).dockViewApi?.panels.forEach((panel: DockviewPanel) => {
                            if (panel.id === id) {
                                panel.setTitle(data.name);
                                if (panel.params?.setSidebarChatTitle) {
                                    panel.params.setSidebarChatTitle({id, name: data.name});
                                }
                            }
                        });
                        
                        // Also update the thread name in the database
                        await fetch(`/api/threads/${id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: data.name })
                        });
                    }
                } catch (error) {
                    console.error('Error generating thread title:', error);
                    // Fallback to a default name if title generation fails
                    const defaultName = `Chat ${new Date().toLocaleDateString()}`;
                    setThreadName(defaultName);
                }
            };

            generateTitle();
        }
    }, [messages, id, threadName]);
    return (
        <>
            <div style={{
                padding: "15px",
                height: "calc(100% - 120px)",
                width: "70%",
                marginLeft: "auto",
                marginRight: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                overflowY: "auto",
            }} ref={scrollableDivRef}>
                {messages.length === 0 ? (
                    <EmptyChatPlaceholder 
                        onPromptSelect={(text) => {
                            // Use the input setter from useChat
                            const event = {
                                target: { value: text }
                            } as React.ChangeEvent<HTMLTextAreaElement>;
                            handleInputChange(event);
                            // Focus the input after setting the value
                            const input = document.querySelector('textarea');
                            input?.focus();
                        }} 
                    />
                ) : messages.map((message) => (
                    <div 
                        key={message.id} 
                        className="whitespace-pre-wrap" 
                        style={{
                            textAlign: message.role === 'user' ? 'right' : 'left' as const,
                            backgroundColor: message.role === 'user' ? 'rgb(243, 233, 255)' : 'rgb(249, 244, 255)',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            maxWidth: '80%',
                            alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                            userSelect: 'text',
                            WebkitUserSelect: 'text',
                            MozUserSelect: 'text',
                            msUserSelect: 'text',
                            cursor: 'text',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                        }}
                    >
                        <div style={{ fontWeight: 500, marginBottom: '4px', color: 'rgb(152, 61, 255)' }}>
                            {message.role === 'user' ? 'You' : 'AI'}
                        </div>
                        <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                    </div>
                ))}
            </div>
            <div style={{
                height: "120px",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}>
                <ChatBar
                    input={input}
                    handleInputChange={(e) => {
                        if (typeof e === 'string') {
                            // Handle direct string input (from prompt selector)
                            handleInputChange({ target: { value: e } } as React.ChangeEvent<HTMLTextAreaElement>);
                        } else {
                            // Handle regular textarea change event
                            handleInputChange(e);
                        }
                    }}
                    handleSubmit={handleFormSubmit}
                    model={model}
                    enabledCapabilities={enabledCapabilities}
                    setModel={setModel}
                    setEnabledCapabilities={setEnabledCapabilities}
                    currentProject={currentProject}
                    thispanel={thispanel}
                />
            </div>
        </>
    )
}

async function replaceVariablesAsync(inputString: string, showDialog: (options: { title: string; description: string }) => Promise<string | null>): Promise<string> {
    const regex = /\${([^}]+)}/g; // Matches ${something}, captures "something"
    let resultString = "";
    let lastIndex = 0;
    let match;
  
    while ((match = regex.exec(inputString)) !== null) {
      // Append the text before the match
      resultString += inputString.substring(lastIndex, match.index);
  
      // Extract the variable name (the "something" inside ${something})
      const variableName = match[1];
  
      // Use the async showDialog function to get replacement text
      const dialogOptions = {
        title: `Replace ${variableName}`,
        description: `Enter replacement for ${variableName}:`,
      };
      const replacementText = await showDialog(dialogOptions);
  
      // Check if the user cancelled the dialog (returned null)
      if (replacementText === null) {
        // Handle cancellation (e.g., replace with an empty string, throw an error, etc.)
        console.warn(`Replacement cancelled for ${variableName}.  Using empty string.`);
        resultString += ""; // Replace with empty string
        // Or: throw new Error(`Replacement cancelled for ${variableName}`);
        // Or: return null; // Indicate failure
      } else {
        // Append the replacement text
        resultString += replacementText;
      }
  
      // Update the last index to the end of the match
      lastIndex = match.index + match[0].length;
    }
  
    // Append any remaining text after the last match
    resultString += inputString.substring(lastIndex);
  
    return resultString;
}

export function ChatBar({
    input,
    handleInputChange,
    handleSubmit,
    model,
    enabledCapabilities,
    setModel,
    setEnabledCapabilities,
    currentProject,
    thispanel,
}: {
    input: string;
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
    handleSubmit: (e?: React.FormEvent) => Promise<void>;
    model: model;
    enabledCapabilities: capability[];
    setModel: (model: model) => void;
    setEnabledCapabilities: (enabledCapabilities: capability[]) => void;
    currentProject: Project | null;
    thispanel: DockviewPanel;
}) {
    const {showDialog} = useInputDialog();
    const [isSubmitting, setIsSubmitting] = useState(false);
    var textAreaRef = useRef<HTMLTextAreaElement>(null);
    
    const handleFormSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isSubmitting) return;
        
        try {
            setIsSubmitting(true);
            await handleSubmit(e);
        } catch (error) {
            console.error('Error in form submission:', error);
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        thispanel.api.onDidActiveChange(() => {
            console.log("Active changed");
            if (thispanel.api.isActive) {
                console.log("Active");
                setTimeout(() => {
                    textAreaRef.current?.focus();
                }, 100);
            }
        }),
        <form onSubmit={handleFormSubmit} style={{
            boxShadow: "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px",
            padding: "5px",
            height: "120px",
            border: "1px solid #e4e4e7",
            borderRadius: "10px",
            borderBottomLeftRadius: "0px",
            borderBottomRightRadius: "0px",
            backgroundColor: "#fafafa",
            width: "70%",
            marginLeft: "auto",
            marginRight: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexWrap: "nowrap",
        }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <textarea
                    ref={textAreaRef}
                    value={input}
                    onChange={handleInputChange}
                    style={{
                        flex: 1,
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        overflowY: 'auto',
                        padding: '5px',
                        backgroundColor: 'transparent',
                    }}
                    placeholder="Type your message..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleFormSubmit();
                        }
                    }}
                    disabled={isSubmitting}
                />
                <div style={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '5px',
                    height: '40px',
                    width: '100%',
                    padding: '0 5px 5px',
                }}>
                    <PromptSelector 
                        setInput={async(value) => {
                            const newValue = await replaceVariablesAsync(value, async (options) => {
                                const result = await showDialog(options);
                                return result;
                            });
                            handleInputChange(newValue);
                            const textarea = document.querySelector('textarea');
                            if (textarea) {
                                textarea.focus();
                                const length = newValue.length;
                                textarea.setSelectionRange(length, length);
                            }
                        }} 
                        currentProject={currentProject} 
                    />
                    <ModelSelector 
                        style={{ marginLeft: '5px' }} 
                        options={models} 
                        value={model} 
                        setValue={setModel} 
                        optionLabel="Model" 
                    />
                    <CapabilitySelector 
                        capabilities={model.capabilities} 
                        value={enabledCapabilities} 
                        setValue={setEnabledCapabilities} 
                        optionLabel="Capability" 
                    />
                    <div style={{ flexGrow: 1 }} />
                    <Button 
                        type="submit"
                        variant="outline" 
                        disabled={isSubmitting || !input.trim()}
                        style={{
                            marginRight: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <RotateCwIcon className="animate-spin" size={15} />
                                Sending...
                            </>
                        ) : (
                            <>
                                <SendIcon size={15} />
                                Send
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    )
}

export function CapabilitySelector({
    capabilities,
    value,
    setValue,
    optionLabel,
}: {
    capabilities: capability[];
    value: capability[];
    setValue: (value: capability[]) => void;
    optionLabel?: string;
}) {
    const { showDialog } = useInputDialog();

    // Check if API key is already set
    const isApiKeySet = React.useMemo(() => {
        const apiKeyCap = value.find(c => c.name === 'apiKey');
        return apiKeyCap?.value ? true : false;
    }, [value]);
    
    var savedkey = localStorage.getItem('openrouter-apiKey');
    console.log('Saved API key:', savedkey);
    if (savedkey != undefined && !isApiKeySet) {
        console.log('API key not set, setting it now');
        // Find the API key capability
        const apiKeyCapability = capabilities.find(c => c.name === 'apiKey');
        if (apiKeyCapability) {
            const updatedCapability = { ...apiKeyCapability, value: savedkey };
            setValue([...value.filter(c => c.name !== 'apiKey'), updatedCapability]);
        }
    }

    const handleApiKeyClick = async () => {
        console.log('API key button clicked');
        try {
            const currentApiKey = value.find(c => c.name === 'apiKey')?.value || '';
            
            const apiKey = await showDialog({
                title: 'Enter OpenRouter API Key',
                description: 'Enter your OpenRouter API key to use OpenRouter models',
                defaultValue: currentApiKey
            });
            
            console.log('Dialog closed with API key:', apiKey ? '***' : 'cancelled');

            if (apiKey !== null) {
                // Find the API key capability
                const apiKeyCapability = capabilities.find(c => c.name === 'apiKey');
                if (apiKeyCapability) {
                    const updatedCapability = { ...apiKeyCapability, value: apiKey };
                    setValue([...value.filter(c => c.name !== 'apiKey'), updatedCapability]);
                    localStorage.setItem('openrouter-apiKey', apiKey);
                }
            }
        } catch (error) {
            console.error('Error in API key dialog:', error);
        }
    };

    const handleCapabilityToggle = (capability: capability, newState: boolean) => {
        console.log('Capability toggled:', capability.name, 'New state:', newState);
        
        if (newState) {
            // If toggling on, add/update the capability with value: true
            const updatedCapability = { 
                ...capability, 
                value: true
            };
            setValue([
                ...value.filter(c => c.name !== capability.name),
                updatedCapability
            ]);
        } else {
            // If toggling off, remove the capability entirely
            setValue(value.filter(c => c.name !== capability.name));
        }
        
        console.log('Updated capabilities:', value);
    };

    return (
        <div className="flex flex-wrap gap-2">
            {/* API Key Button - Always show for OpenRouter models */}
            {capabilities.some(c => c.name === 'apiKey') && (
                <Button 
                    variant={isApiKeySet ? 'default' : 'outline'}  
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleApiKeyClick();
                    }}
                >
                    <KeyIcon size={14} />
                    {isApiKeySet ? 'API Key Set' : 'Set API Key'}
                    {isApiKeySet && <CheckIcon size={14} />}
                </Button>
            )}
            
            {capabilities.map((capability) => {
                if (capability.name === 'apiKey') {
                    return null;
                }
                const isActive = value.some(c => c.name === capability.name);
                return (
                    <Tooltip key={capability.name}>
                        <TooltipTrigger asChild>
                            <div>
                                <div className="relative">
                                    <Toggle
                                        variant="outline"
                                        onPressedChange={(on) => handleCapabilityToggle(capability, on)}
                                        pressed={isActive}
                                        style={{
                                            backgroundColor: isActive ? 'rgb(152, 61, 255)' : 'transparent',
                                            color: isActive ? '#ffffff' : '#666666',
                                        }}
                                    >
                                        <capability.icon size={15} />
                                        {capability.friendlyName}
                                    </Toggle>
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{capability.description}</p>
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    );
}

export function PromptSelector({setInput, currentProject}: {setInput: (input: string) => void, currentProject: Project | null}) {
    const organizationPrompts = useOrganizationPrompts();
    const personalPrompts = usePersonalPrompts();
    var projects = useProjects();
    const [open, setOpen] = useState(false);
    const [currentProjectOpen, setCurrentProjectOpen] = useState<Project | null>(currentProject);
    const projectPrompts = useProjectPrompts(currentProjectOpen?.id ?? null);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" style={{
                    marginLeft: "5px",
                }}>
                    <LibraryIcon size={15} />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select a prompt</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="Personal">
                    <TabsList style={{
                        width: "100%",
                    }}>
                        <TabsTrigger value="Personal">Personal</TabsTrigger>
                        {authClient.useActiveOrganization().data && (
                            <TabsTrigger value="Organization">Organization</TabsTrigger>
                        )}
                        <TabsTrigger value="Project">Project</TabsTrigger>
                    </TabsList>
                    <TabsContent value="Personal">
                        {personalPrompts.data.length === 0 && (
                            <div style={{
                                height: "100%",
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                padding: "25px",
                            }}> 
                                <TextIcon size={25} />
                                <div style={{
                                    fontSize: "16px",
                                    color: "#666666",
                                    fontWeight: "500",
                                }}>No prompts found</div>
                                <div style={{
                                    fontSize: "12px",
                                    color: "#999",
                                    fontWeight: "400",
                                }}>Create a prompt in the Library</div>
                            </div>
                        )}
                        {personalPrompts.data.map((prompt) => (
                            <div key={prompt.id} onClick={() => {
                                setInput(prompt.content);
                                setOpen(false);
                            }} style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: "10px",
                                marginTop: "15px",
                                cursor: "pointer",
                            }}>
                                <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "5px",
                                    backgroundColor: "#983DFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <TextIcon size={20} color="#fff"/>
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: "16px",
                                        fontWeight: "500",
                                    }}>{prompt.name}</div>
                                    <div style={{
                                        fontSize: "12px",
                                        color: "#999",
                                        fontWeight: "400",
                                    }}>{prompt.description}</div>
                                </div>
                            </div>
                        ))}
                    </TabsContent>
                    <TabsContent value="Organization">
                        {authClient.useActiveOrganization().data && (
                            personalPrompts.data.length === 0 ? (
                                <div style={{
                                    height: "100%",
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "10px",
                                    padding: "25px",
                                }}>
                                    <TextIcon size={25} />
                                    <div style={{
                                        fontSize: "16px",
                                        color: "#666666",
                                        fontWeight: "500",
                                    }}>No prompts found</div>
                                    <div style={{
                                        fontSize: "12px",
                                        color: "#999",
                                        fontWeight: "400",
                                    }}>Create a prompt in the Library</div>
                                </div>
                            ) : (
                            organizationPrompts.data.map((prompt) => (
                                <div key={prompt.id} onClick={() => setInput(prompt.content)} style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: "10px",
                                    marginTop: "15px",
                                    cursor: "pointer",
                                }}>
                                    <div style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "5px",
                                        backgroundColor: "#983DFF",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                        <TextIcon size={20} color="#fff"/>
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: "16px",
                                            fontWeight: "500",
                                        }}>{prompt.name}</div>
                                        <div style={{
                                            fontSize: "12px",
                                            color: "#999",
                                            fontWeight: "400",
                                        }}>{prompt.description}</div>
                                    </div>
                                </div>
                            )))
                        )}
                    </TabsContent>
                    <TabsContent value="Project">
                        {currentProjectOpen ? (
                            <>
                                <div style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: "10px",
                                    marginTop: "15px",
                                    cursor: "pointer",
                                }}>
                                    <ChevronLeftIcon size={20} color="#666666" onClick={() => setCurrentProjectOpen(null)} />
                                    <div>
                                        <div style={{
                                            fontSize: "16px",
                                            fontWeight: "500",
                                        }}>{currentProjectOpen.name}</div>
                                    </div>
                                </div>
                                {projectPrompts.data.map((prompt) => (
                                    <div key={prompt.id} onClick={() => {
                                        setInput(prompt.content);
                                        setCurrentProjectOpen(null);
                                        setOpen(false);
                                    }} style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: "10px",
                                        marginTop: "15px",
                                        cursor: "pointer",
                                    }}>
                                        <div style={{
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "5px",
                                            backgroundColor: "#983DFF",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}>
                                            <TextIcon size={20} color="#fff"/>
                                        </div>
                                        <div>
                                            <div style={{
                                                fontSize: "16px",
                                                fontWeight: "500",
                                            }}>{prompt.name}</div>
                                            <div style={{
                                                fontSize: "12px",
                                                color: "#999",
                                                fontWeight: "400",
                                            }}>{prompt.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            projects.data.map((project) => (
                                <div key={project.id} onClick={() => {
                                    setCurrentProjectOpen(project);
                                    
                                }} style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: "10px",
                                    marginTop: "15px",
                                    cursor: "pointer",
                                }}>
                                    <div style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "5px",
                                        backgroundColor: "#983DFF",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                        <TextIcon size={20} color="#fff"/>
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: "16px",
                                            fontWeight: "500",
                                        }}>{project.name}</div>
                                        <div style={{
                                            fontSize: "12px",
                                            color: "#999",
                                            fontWeight: "400",
                                        }}>{project.description}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

export function Watermark() {
    return (
        <div style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
        }}> 
            <SparkleIcon size={25} />
            <div style={{
                fontSize: "16px",
                color: "#666666",
                fontWeight: "500",
            }}>AIChat</div>
            <div style={{
                fontSize: "12px",
                color: "#999",
                fontWeight: "400",
            }}>Open or create a chat in the sidebar</div>
        </div>
    )
}

export function LibraryPage() {
    var org = authClient.useActiveOrganization();
    var threads = useThreads();
    return (
        <div style={{
            height: "100%",
            width: "100%",
            overflowY: "scroll",
        }}>
            <div style={{
                fontSize: "30px",
                fontWeight: "500",
                padding: "25px",
            }}>Library</div>
            <div style={{
                padding: "25px",
                paddingTop: "0px",
                display: "flex",
                flexDirection: "row",
                gap: "25px",
                overflowX: "scroll",
            }}>
                <LibraryFolderCard title="Archive" subtitle="Archived chats" onClick={() => {openArchivedChats()}} icon={<ArchiveIcon size={20} />} />
                {org.data && (
                    <LibraryFolderCard title="Organization" subtitle="Organization chats" onClick={() => {openOrganizationChats()}} icon={<UsersIcon size={20} />} />
                )}
                <LibraryFolderCard title="Projects" subtitle="Groups of chats" onClick={() => {openProjectLibrary()}} icon={<FolderOpenIcon size={20} />} />
                {/* <LibraryFolderCard title="Models" subtitle="AI Models" onClick={() => {}} icon={<BotIcon size={20} />} /> */}
                <LibraryFolderCard title="Prompts" subtitle="Saved Prompts" onClick={() => {openPromptsLibrary()}} icon={<TextIcon size={20} />} />
            </div>
            <div style={{
                fontSize: "18px",
                fontWeight: "400",
                padding: "25px",
                paddingTop: "0px",
                paddingBottom: "10px"
            }}>Personal Chats</div>
            <div style={{
                margin: "25px",
                marginTop: "0px",
                borderRadius: "15px",
                border: "1px solid #e4e4e7",
                backgroundColor: "#fafafa",
            }}>
                {threads.data?.filter(thread => !thread.archived && !thread.projectId && !thread.organizationPublic).map(thread => (
                    <ChatListItem key={thread.id} thread={thread} onClick={() => openThread(thread)} reload={() => threads.refresh()} />
                ))}
            </div>
        </div>
    )
}

export function LibraryPrompts({panelapi}: {panelapi: DockviewPanelApi}) {
    var [currentProject, setCurrentProject] = useState<string | null>(null);
    const { showDialog } = useInputDialog();
    var personalPrompts = usePersonalPrompts();
    var organizationPrompts = useOrganizationPrompts();
    panelapi.onDidFocusChange(() => {
        personalPrompts.refresh();
        organizationPrompts.refresh();
    })
    return (
        <div style={{
            height: "100%",
            width: "100%",
            overflowY: "scroll",
        }}>
            <div style={{
                padding: "25px",
                display: "flex",
                alignItems: "center",
            }}>
                <div style={{
                    fontSize: "30px",
                    fontWeight: "500"
                }}>
                    Prompts
                </div>
                <div style={{
                    flex: 1,
                }}/>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <PlusIcon size={16} className="mr-2" />
                            New Prompt
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>New Prompt</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {authClient.useActiveOrganization().data && (
                            <DropdownMenuItem onClick={async () => {
                                const name = await showDialog({title: "New Organization Prompt", description: "Enter the name of the prompt", defaultValue: "New Organization Prompt"});
                                if (!name) {
                                    return;
                                }
                                var prompt = await createOrganizationPrompt({name: name, description: "", content: ""});
                                openPromptEditor(prompt);
                                personalPrompts.refresh();
                                organizationPrompts.refresh();
                            }}><UsersIcon size={16} />Organization Prompt</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={async () => {
                            const name = await showDialog({title: "New Personal Prompt", description: "Enter the name of the prompt", defaultValue: "New Personal Prompt"});
                            if (!name) {
                                return;
                            }
                            var prompt = await createPersonalPrompt({name: name, description: "", content: ""});
                            openPromptEditor(prompt);
                            personalPrompts.refresh();
                            organizationPrompts.refresh();
                        }}><UserIcon size={16} />Personal Prompt</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" style={{
                    marginLeft: "10px",
                }} onClick={() => {
                    personalPrompts.refresh();
                    organizationPrompts.refresh();
                }}>
                    <RotateCwIcon size={16} />
                </Button>
            </div>
            <Tabs defaultValue="Personal" style={{
                margin: "25px",
                marginTop: "0px",
            }}>
                <TabsList style={{
                    width: "100%",
                }}>
                    <TabsTrigger value="Personal">Personal</TabsTrigger>
                    {authClient.useActiveOrganization().data && (
                        <TabsTrigger value="Organization">Organization</TabsTrigger>
                    )}
                </TabsList>
                <div style={{
                    height: "10px",
                }}/>
                <TabsContent value="Personal">
                    <div style={{
                        borderRadius: "15px",
                        border: "1px solid #e4e4e7",
                        backgroundColor: "#fafafa",
                    }}>
                        {(personalPrompts.data?.length === 0 && personalPrompts.loaded) && (
                            <div style={{
                                height: "100%",
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                padding: "25px",
                            }}> 
                                <TextIcon size={25} />
                                <div style={{
                                    fontSize: "16px",
                                    color: "#666666",
                                    fontWeight: "500",
                                }}>No personal prompts found</div>
                                <div style={{
                                    fontSize: "12px",
                                    color: "#999",
                                    fontWeight: "400",
                                }}>Create a prompt using the button above</div>
                            </div>
                        )}
                        {personalPrompts.data?.map(prompt => (
                            <PromptListItem key={prompt.id} prompt={prompt} onClick={() => openPromptEditor(prompt)} />
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="Organization">
                    <div style={{
                        borderRadius: "15px",
                        border: "1px solid #e4e4e7",
                        backgroundColor: "#fafafa",
                    }}>
                        {(organizationPrompts.data?.length === 0 && organizationPrompts.loaded) && (
                            <div style={{
                                height: "100%",
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                padding: "25px",
                            }}> 
                                <TextIcon size={25} />
                                <div style={{
                                    fontSize: "16px",
                                    color: "#666666",
                                    fontWeight: "500",
                                }}>No organization prompts found</div>
                                <div style={{
                                    fontSize: "12px",
                                    color: "#999",
                                    fontWeight: "400",
                                }}>Create a prompt using the button above</div>
                            </div>
                        )}
                        {organizationPrompts.data?.map(prompt => (
                            <PromptListItem key={prompt.id} prompt={prompt} onClick={() => openPromptEditor(prompt)} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function PromptListItem({prompt, onClick}: {prompt: Prompt, onClick?: () => void}) {
    return (
        <div style={{
            padding: "10px",
            paddingLeft: "15px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "15px",
        }} className="ChatListItem" onClick={onClick}>
            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                height: "35px",
                width: "35px",
                borderRadius: "5px",
                color: "#fff",
                backgroundColor: "#983DFF",
            }}>
                <TextIcon size={20} />
            </div>
            <div style={{
                marginRight: "10px",
            }}>
                <div>{prompt.name}</div>
                <div style={{
                    fontSize: "12px",
                    color: "#999",
                    fontWeight: "400",
                }}>{prompt.description}</div>
            </div>
        </div>
    )
}

function LibraryFolderCard({title, onClick, subtitle, icon, color}: {title: string, onClick: () => void, subtitle?: string, icon?: React.ReactNode, color?: string}) {
    return (
        <div style={{
            flexShrink: 0,
            padding: "10px",
            paddingLeft: "15px",
            borderRadius: "15px",
            border: "1px solid #e4e4e7",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "15px",
        }} onClick={onClick} className="libraryFolderCard">
            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                height: "35px",
                width: "35px",
                borderRadius: "5px",
                color: "#fff",
                backgroundColor: color? color : "#983DFF",
                flexShrink: 0,
            }}>
                {icon}
            </div>
            <div style={{
               textAlign: "left",
            }}>
                <div>{title}</div>
                {subtitle && (
                    <div style={{
                        fontSize: "12px",
                        color: "#999",
                        fontWeight: "400",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "200px",
                    }}>{subtitle}</div>
                )}
            </div>
        </div>
    )
}

var ChatListItem = ({thread, onClick, reload}: {thread: Thread, onClick?: () => void, reload?: () => void}) => {
    var { showDialog, showConfirm } = useInputDialog();
    var currentOrg = authClient.useActiveOrganization()
    var session = authClient.useSession()
    return (
        <div style={{
            padding: "10px",
            paddingLeft: "15px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "15px",
        }} className="ChatListItem" onClick={onClick}>
            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                height: "35px",
                width: "35px",
                borderRadius: "5px",
                color: "#fff",
                backgroundColor: "#983DFF",
            }}>
                {thread.public? (
                    <ShareIcon size={20} />
                ): (
                    <MessageSquare size={20} />
                )}
            </div>
            <div style={{
                marginRight: "10px",
            }}>
                <div>{thread.name}</div>
                <div style={{
                    fontSize: "12px",
                    color: "#999",
                    fontWeight: "400",
                }}>{new Date(thread.updatedAt).toDateString() + " at " + new Date(thread.updatedAt).toLocaleTimeString()} {(thread.organizationPublic && currentOrg?.data != null ? ". Created by " + currentOrg.data.members.find((member: any) => member.user.id === thread.ownerId)?.user.name : "")}</div>
            </div>
            <div style={{flexGrow: 1}}></div>
            {session.data?.user.id === thread.ownerId && (
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <MoreVerticalIcon size={18} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => {
                            showConfirm({
                                title: "Delete Thread",
                                description: "Are you sure you want to delete this thread?",
                                confirmText: "Delete",
                                cancelText: "Cancel",
                            }).then(async (confirmed) => {
                                if (confirmed) {
                                    await deleteThread(thread.id);
                                    if (reload) {
                                        reload();
                                    }
                                }
                            });
                        }}>
                            <Trash2Icon size={16} style={{color: "rgb(198, 54, 54)"}} /> <div style={{color: "rgb(198, 54, 54)"}}>Delete</div></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            showDialog({
                                title: "Rename Thread",
                                label: "New Name",
                                defaultValue: thread.name,
                                confirmText: "Rename",
                                cancelText: "Cancel",
                            }).then(async (name) => {
                                console.log(name);
                                if (name) {
                                    await renameThread(thread.id, name);
                                    if (reload) {
                                        reload();
                                    }
                                }
                            });
                        }}>
                            <PenBoxIcon size={16} /> <div style={{color: "#666666"}}>Rename</div></DropdownMenuItem>
                            {thread.organizationId && (
                                <DropdownMenuItem onClick={async () => {
                                    await moveThreadToOrganization(thread);
                                    if (reload) {
                                        reload();
                                    }
                                }}>
                                    <FolderInputIcon size={16} /> <div style={{color: "#666666"}}>Move to organization</div></DropdownMenuItem>
                            )}
                        <DropdownMenuItem onClick={async () => {
                            await archiveThread(thread);
                            if (reload) {
                                reload();
                            }
                        }}>
                            {thread.archived? (
                                <>
                                    <ArchiveRestoreIcon size={16} /> <div style={{color: "#666666"}}>Unarchive</div>
                                </>
                            ): (
                                <>
                                    <ArchiveIcon size={16} /> <div style={{color: "#666666"}}>Archive</div>
                                </>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            <div style={{width: "1px"}}></div>
        </div>
    )
}

export function PromptEditor({prompt}: {prompt: Prompt}) {
    const { showConfirm } = useInputDialog();
    var [name, setName] = useState(prompt.name);
    var [description, setDescription] = useState(prompt.description);
    var [content, setContent] = useState(prompt.content);
    var [saved, setSaved] = useState(true);
    var originalName = prompt.name;
    var originalDescription = prompt.description;
    var originalContent = prompt.content;
    useEffect(() => {
        if (name !== originalName || description !== originalDescription || content !== originalContent) {
            setSaved(false);
        } else {
            setSaved(true);
        }
    }, [name, description, content]);
    return (
        <div style={{
            padding: "25px",
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
        }}>
            <div style={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "15px",
            }}>
                <div>
                    <input type="text" placeholder="Prompt name" value={name} style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        width: "100%",
                    }} onChange={(e) => setName(e.target.value)}/>
                    <input type="text" placeholder="Description" value={description} style={{
                        fontSize: "14px",
                        fontWeight: "400",
                        width: "100%",
                    }} onChange={(e) => setDescription(e.target.value)}/>
                </div>
                <div style={{
                    flexGrow: 1,
                }}></div>
                {!saved && (
                    <div style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "15px",
                    }}>
                        <Button 
                          onClick={async () => {
                            prompt.name = name;
                            prompt.description = description;
                            prompt.content = content;
                            await updatePrompt(prompt);
                            setSaved(true);
                          }} 
                          variant="outline"
                        >
                          Save
                        </Button>
                        <Button 
                          onClick={async () => {
                            const shouldDiscard = await showConfirm({
                              title: 'Discard changes?',
                              description: 'Are you sure you want to discard your changes?',
                              confirmText: 'Discard',
                              variant: 'destructive',
                              cancelText: 'Cancel'
                            });
                            if (shouldDiscard) {
                              setName(originalName);
                              setDescription(originalDescription);
                              setContent(originalContent);
                              setSaved(true);
                            }
                          }} 
                          variant="outline"
                        >
                          Discard
                        </Button>
                    </div>
                )}
            </div>
            <textarea placeholder="Prompt content" value={content} style={{
                fontSize: "14px",
                fontWeight: "400",
                width: "100%",
                height: "100%",
                outline: "none",
                resize: "none",
                overflow: "auto",
                overflowY: "scroll",
                padding: "10px",
                backgroundColor: "#fafafa",
                border: "1px solid #e4e4e7",
                borderRadius: "10px",
            }} onChange={(e) => setContent(e.target.value)}/>
        </div>
    )
}

export function ProjectLibrary() {
    const projects = useProjects();
    const { showDialog } = useInputDialog();
    
    return (
        <div style={{
            height: "100%",
            width: "100%",
            overflowY: "scroll",
        }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "25px",
                paddingBottom: "25px",
            }}>
                <div style={{
                    fontSize: "30px",
                    fontWeight: "500"
                }}>
                    Projects
                </div>
                <Button
                    onClick={async () => {
                        const result = await showDialog({
                            title: "Create Project",
                            description: "Enter a name for your project",
                            defaultValue: "New Project",
                        });
                        if (result) {
                            const response = await fetch("/api/projects", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    name: result,
                                }),
                            });
                            if (response.ok) {
                                const data = await response.json();
                                console.log("Project created:", data);
                                projects.refresh();
                            } else {
                                console.error("Failed to create project:", await response.text());
                            }
                        }
                    }}
                    variant="outline"
                    size="sm"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    <PlusIcon size={14} />
                    Create New
                </Button>
            </div>
            
            {!projects.loaded ? (
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <Loader2Icon size={24} className="animate-spin" />
                </div>
            ) : projects.data.length === 0 ? (
                <div style={{
                    margin: "0 25px",
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#666",
                    border: "1px dashed #e4e4e7",
                    borderRadius: "8px",
                    backgroundColor: "#fafafa",
                    justifyContent: "center",
                }}>
                    <FolderOpenIcon size={32} style={{ marginBottom: "12px", opacity: 0.6, margin: "12px auto"}} />
                    <div style={{ fontWeight: 500, marginBottom: "4px", margin: "4px auto" }}>No projects yet</div>
                    <div style={{ fontSize: "14px", margin: "0 auto" }}>Create your first project to get started</div>
                </div>
            ) : (
                <div style={{
                    margin: "0 25px",
                    borderRadius: "8px",
                    border: "1px solid #e4e4e7",
                    backgroundColor: "#fafafa",
                    overflow: "hidden"
                }}>
                    {projects.data.map((project: Project, index: number) => (
                        <div 
                            key={project.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px 16px",
                                borderBottom: index < projects.data.length - 1 ? "1px solid #f0f0f0" : "none",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                                backgroundColor: "#ffffff"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#f8f8f8";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#ffffff";
                            }}
                            onClick={() => {
                                openProject(project);
                            }}
                        >
                            <FolderOpenIcon size={18} style={{ color: "#6d28d9", marginRight: "12px" }} />
                            <div>
                                <div style={{ fontWeight: 500 }}>{project.name}</div>
                                {project.description && (
                                    <div style={{
                                        fontSize: "13px",
                                        color: "#666",
                                        marginTop: "2px"
                                    }}>
                                        {project.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#6b7280',
        }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: '#9ca3af',
            }}>
                {icon}
            </div>
            <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#111827',
            }}>
                {title}
            </h3>
            <p style={{
                maxWidth: '400px',
                lineHeight: '1.5',
                margin: 0,
            }}>
                {description}
            </p>
        </div>
    );
}

export function ArchivedThreadsPage() {
    var threads = useArchivedThreads();
    
    if (!threads.loaded) {
        return (
            <div style={{
                height: "100%",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                <Loader2Icon className="animate-spin" size={24} />
            </div>
        );
    }

    return (
        <div style={{
            height: "100%",
            width: "100%",
            overflowY: "auto",
        }}>
            <div style={{
                fontSize: "30px",
                fontWeight: "500",
                padding: "25px",
            }}>Archived Chats</div>
            <div style={{
                margin: "25px",
                marginTop: "0px",
                borderRadius: "15px",
                border: "1px solid #e4e4e7",
                backgroundColor: "#fafafa",
                minHeight: "200px",
            }}>
                {threads.data?.length > 0 ? (
                    threads.data.map(thread => (
                        <ChatListItem key={thread.id} thread={thread} onClick={() => openThread(thread)} reload={() => threads.refresh()}/>
                    ))
                ) : (
                    <EmptyState
                        icon={<ArchiveIcon size={24} />}
                        title="No archived chats"
                        description="When you archive chats, they'll appear here."
                    />
                )}
            </div>
        </div>
    );
}

export function OrganizationThreadsPage() {
    var threads = useOrganizationThreads();
    
    if (!threads.loaded) {
        return (
            <div style={{
                height: "100%",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                <Loader2Icon className="animate-spin" size={24} />
            </div>
        );
    }

    return (
        <div style={{
            height: "100%",
            width: "100%",
            overflowY: "auto",
        }}>
            <div style={{
                fontSize: "30px",
                fontWeight: "500",
                padding: "25px",
            }}>Organization Chats</div>
            <div style={{
                margin: "25px",
                marginTop: "0px",
                borderRadius: "15px",
                border: "1px solid #e4e4e7",
                backgroundColor: "#fafafa",
                minHeight: "200px",
            }}>
                {threads.data?.length > 0 ? (
                    threads.data.map(thread => (
                        <ChatListItem key={thread.id} thread={thread} onClick={() => openThread(thread)} reload={() => threads.refresh()}/>
                    ))
                ) : (
                    <EmptyState
                        icon={<UsersIcon size={24} />}
                        title="No organization chats"
                        description="Organization chats shared with you will appear here."
                    />
                )}
            </div>
        </div>
    );
}

export function ProjectPage({project: initialProject, api}: {project: Project | null, api?: any}) {
    const [project, setProject] = React.useState<Project | null>(initialProject);
    const [isRenaming, setIsRenaming] = React.useState(false);
    const [newName, setNewName] = React.useState(initialProject?.name || '');
    const { showDialog } = useInputDialog();
    
    // Update local state if initialProject changes (e.g., from parent or tab parameters)
    React.useEffect(() => {
        if (initialProject) {
            setProject(initialProject);
            setNewName(initialProject.name);
            
            // Update tab title when initialProject changes
            if (api) {
                api.setTitle(initialProject.name);
            }
        }
    }, [initialProject, api]);
    
    if (!project) {
        return <div>Loading project...</div>;
    }
    
    const threadsResult = useProjectThreads(project.id) as unknown as ProjectThreadsResult;
    const promptsResult = useProjectPrompts(project.id) as unknown as ProjectPromptsResult;
    const { showConfirm } = useInputDialog();
    
    // Update tab title when project name changes
    React.useEffect(() => {
        if (api && project?.name) {
            api.setTitle(project.name);
            // Update tab parameters to persist the new name
            api.updateParameters({ project: { ...project, name: project.name } });
        }
    }, [project?.name, api]);
    
    // Create thread utilities
    const threads = threadsResult;
    
    // Ensure prompts has refresh method
    if (!promptsResult.refresh) {
        promptsResult.refresh = () => {
            const event = new CustomEvent('refresh-prompts');
            window.dispatchEvent(event);
        };
    }
    
    const handleRename = async () => {
        if (!project) return;
        
        const trimmedName = newName.trim();
        if (!trimmedName || trimmedName === project.name) {
            setNewName(project.name);
            setIsRenaming(false);
            return;
        }
        
        try {
            const response = await fetch(`/api/projects/${project.id}?id=${project.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedName })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to update project');
            }
            
            const updatedProject = await response.json();
            
            // Update local state
            const updatedProjectWithId = { ...updatedProject, id: project.id };
            setProject(updatedProjectWithId);
            setNewName(trimmedName);
            
            // Update tab parameters to persist the new name
            if (api) {
                api.updateParameters({ project: updatedProjectWithId });
            }
            
            // Dispatch event to update tab title and other components
            window.dispatchEvent(new CustomEvent('project-updated', {
                detail: {
                    projectId: updatedProject.id,
                    name: trimmedName
                }
            }));
            
        } catch (error) {
            console.error('Error renaming project:', error);
            // Reset to original name on error
            setNewName(project.name);
            // Show error to user
            const errorMessage = error instanceof Error ? error.message : 'Failed to rename project';
            alert(errorMessage);
        } finally {
            setIsRenaming(false);
        }
    };
    
    const handleCreateThread = async () => {
        try {
            var thread = await createProjectThread(`New Chat`, project!);
            setTimeout(() => {
                threads.refresh();
                openThread(thread);
            }, 100);
        } catch (error) {
            console.error('Error creating thread:', error);
            alert(error instanceof Error ? error.message : 'Failed to create thread');
        }
    };
    
    const handleCreatePrompt = async () => {
        try {
            const promptName = await showDialog({
                title: 'New Prompt',
                description: 'Enter a name for your new prompt',
                defaultValue: 'New Prompt'
            });
            
            if (!promptName) return;
            
            const response = await fetch(`/api/prompts/project?projectId=${project.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: promptName,
                    description: '',
                    content: ''
                })
            });
            
            if (response.ok) {
                promptsResult.refresh();
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to create prompt');
            }
        } catch (error) {
            console.error('Error creating prompt:', error);
            alert(error instanceof Error ? error.message : 'Failed to create prompt');
        }
    };
    
    return (
        <div style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fff",
        }}>
            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: "1px solid #e4e4e7",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}>
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                    }}>
                        {isRenaming ? (
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename();
                                    if (e.key === 'Escape') {
                                        setNewName(project.name);
                                        setIsRenaming(false);
                                    }
                                }}
                                autoFocus
                                style={{
                                    fontSize: '20px',
                                    fontWeight: 600,
                                    color: '#18181b',
                                    border: '1px solid #e4e4e7',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    width: '100%',
                                    maxWidth: '400px',
                                }}
                            />
                        ) : (
                            <h1 
                                style={{
                                    fontSize: "20px",
                                    fontWeight: 600,
                                    color: "#18181b",
                                    margin: 0,
                                    cursor: 'pointer',
                                }}
                                onClick={() => {
                                    setNewName(project.name);
                                    setIsRenaming(true);
                                }}
                            >
                                {project.name}
                            </h1>
                        )}
                        <button
                            onClick={() => {
                                setNewName(project.name);
                                setIsRenaming(!isRenaming);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#6b7280',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            title={isRenaming ? 'Cancel' : 'Rename project'}
                        >
                            {isRenaming ? <XIcon size={16} /> : <PencilIcon size={16} />}
                        </button>
                    </div>
                    <div style={{
                        display: "flex",
                        alignItems: 'center',
                        gap: "10px",
                        color: "#71717a",
                        fontSize: "14px",
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{(threads.data?.length || 0)} threads</span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleCreateThread}
                                style={{ width: '24px', height: '24px' }}
                            >
                                <PlusIcon size={16} />
                            </Button>
                        </div>
                        <span>•</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{(promptsResult.data?.length || 0)} prompts</span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleCreatePrompt}
                                style={{ width: '24px', height: '24px' }}
                            >
                                <PlusIcon size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {promptsResult.refresh(); threads.refresh();}}
                >
                    <RotateCwIcon size={16} />
                </Button>
            </div>

            <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
            }}>
                <div style={{
                    marginBottom: "24px",
                }}>
                    <h2 style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        margin: "0 0 16px 0",
                        color: "#18181b",
                    }}>
                        Threads
                    </h2>
                    <div style={{
                        borderRadius: "15px",
                        border: "1px solid #e4e4e7",
                        backgroundColor: "#fafafa",
                        overflow: "hidden",
                    }}>
                        {threads.data?.length ? (
                            threads.data.map((thread: ThreadType) => (
                                <ChatListItem key={thread.id} thread={thread} onClick={() => openThread(thread)} reload={() => threads.refresh()}/>
                            ))
                        ) : (
                            <div style={{
                                padding: "24px",
                                textAlign: "center",
                                color: "#71717a",
                                fontSize: "14px",
                            }}>
                                No threads in this project yet
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h2 style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        margin: "0 0 16px 0",
                        color: "#18181b",
                    }}>
                        Prompts
                    </h2>
                    <div style={{
                        borderRadius: "15px",
                        border: "1px solid #e4e4e7",
                        backgroundColor: "#fafafa",
                        overflow: "hidden",
                    }}>
                        {promptsResult.data?.length ? (
                            promptsResult.data.map(prompt => (
                                <PromptListItem
                                    key={prompt.id}
                                    prompt={prompt}
                                    onClick={() => openPromptEditor(prompt)}
                                />
                            ))
                        ) : (
                            <div style={{
                                padding: "24px",
                                textAlign: "center",
                                color: "#71717a",
                                fontSize: "14px",
                            }}>
                                No prompts in this project yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}