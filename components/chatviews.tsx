import { useChat } from "@ai-sdk/react";
import { SparkleIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Thread, Message } from "@/app/generated/prisma";
import { DockviewPanel } from "dockview-react";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

export function RegularChat({
    id,
}: {
    id: string;
}) {
    const [threadName, setThreadName] = useState<string>("");
    const [initialMessages, setInitialMessages] = useState<{data: Message[], loaded: boolean}>({data: [], loaded: false});
    if (!initialMessages.loaded) {
        getThread(id).then(thread => {
            console.log(thread.name);
            setThreadName(thread.name);
            setInitialMessages({data: thread.messages, loaded: true});
        });
    }
    const { messages, input, handleInputChange, handleSubmit } = useChat({
        initialMessages: initialMessages.data.map(message => ({
            id: message.id,
            content: message.text,
            role: message.role,
        })),
        onFinish: async (message, options) => {
            await createMessage({
                text: message.content,
                role: message.role,
                threadId: id,
            });
            console.log(threadName)
            if (threadName === "New Chat" && messages.length < 2) {
                fetch("/api/generatethreadname?threadId=" + id).then(res => res.json()).then(data => {
                    setThreadName(data.name);
                    (window as any).dockViewApi?.panels.forEach((panel: DockviewPanel) => {
                        if (panel.id === id) {
                            panel.setTitle(data.name);
                            panel.params?.setSidebarChatTitle({id, name: data.name});
                        }
                    });
                });
            }
        },
    });
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
                overflowY: "scroll",
            }}>
                {messages.map(message => {
                    var pos = "left"
                    if (message.role === 'user') {
                        pos = "right"
                    }
                    return <div key={message.id} className="whitespace-pre-wrap" style={{
                        textAlign: pos,
                    }}>
                        <div>
                            {message.role === 'user' ? 'User: ' : 'AI: '}
                        </div>
                        {message.parts.map((part, i) => {
                                switch (part.type) {
                                    case 'text':
                                        return <Markdown key={`${message.id}-${i}`} remarkPlugins={[remarkGfm]}>{part.text}</Markdown>;
                                }
                            })}
                    </div>
                })}
            </div>
            <div style={{
                height: "120px",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}>
                <textarea
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                            handleSubmit();
                            await createMessage({
                                text: input,
                                role: "user",
                                threadId: id,
                            });
                        }
                    }}
                    style={{
                        boxShadow: "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px",
                        padding: "5px",
                        height: "80px",
                        border: "1px solid #e4e4e7",
                        borderRadius: "5px",
                        backgroundColor: "#fafafa",
                        width: "70%",
                        marginLeft: "auto",
                        marginRight: "auto",
                    }}
                />
            </div>
        </>
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
    return (
        <div>
            Library
        </div>
    )
}