import { HomeIcon, UsersIcon, LibraryIcon, BotIcon, PlusIcon, SparkleIcon, MessageSquareDashedIcon, MessageSquareIcon, MessageSquareLockIcon, Trash2Icon, ShareIcon, EditIcon, MoveIcon, FolderInputIcon } from "lucide-react"
import { useMutation, useQuery } from "convex/react";
import React, { useState, useEffect } from "react";
import { Thread } from "@/app/generated/prisma";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { authClient } from "@/lib/auth-client";

var createThread = async (name: string): Promise<Thread> => {
    const response = await fetch("/api/threads", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name,
        }),
    });
    return await response.json();
}

var sidebarThreadsView = ({orgid, threads, setSidebarChatTitle}: {orgid: string | undefined, threads: Thread[], setSidebarChatTitle: (title: {id: string, name: string}) => void}) => {
    return threads.map(thread => (
        <ContextMenu key={thread.id}>
            <ContextMenuTrigger>
                <SidebarItem onClick={() => {
                    var found = false;
                    (window as any).dockViewApi.panels.forEach((panel: any) => {
                        console.log(panel.id, thread.id);
                        if (panel.id === thread.id) {
                            console.log("Panel found");
                            panel.focus();
                            found = true;
                            return;
                        }
                    });
                    if (!found) {
                        (window as any).dockViewApi?.addPanel({
                            component: "regularChat",
                            title: thread.name,
                            id: thread.id,
                            tabComponent: "regularChat",
                            params: {
                                id: thread.id,
                                setSidebarChatTitle,
                            }
                        });
                    }
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexDirection: "row",
                        maxWidth: "100%",
                        minWidth: "100%",
                    }}>
                        {thread.public? (
                            <MessageSquareIcon size={16} style={{
                                flexShrink: 0,
                            }} />
                        ): (
                            <MessageSquareLockIcon size={16} style={{
                                flexShrink: 0,
                            }} />
                        )}
                        <div style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100%",
                        }}>{thread.name}</div>
                    </div>
                </SidebarItem>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem style={{
                    color: "rgb(198, 54, 54)",
                }}><Trash2Icon style={{
                    color: "rgb(198, 54, 54)",
                }} size={16} />Delete</ContextMenuItem>
                <ContextMenuItem style={{
                    color: "#666666",
                }}><ShareIcon size={16} />Share</ContextMenuItem>
                <ContextMenuItem style={{
                    color: "#666666",
                }}><EditIcon size={16} />Rename</ContextMenuItem>
                <ContextMenuItem style={{
                    color: "#666666",
                }}><FolderInputIcon size={16} />Move</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    ))
}

export function Sidebar() {
    var currentOrg = authClient.useActiveOrganization()
    const [threads, setThreads] = useState<{data: Thread[], loaded: boolean}>({data: [], loaded: false});
    
    // Reload threads when organization changes or when threads haven't been loaded yet
    useEffect(() => {
        fetch("/api/threads").then(res => res.json()).then(data => {
            setThreads({data: data, loaded: true});
        });
    }, [currentOrg.data?.id ?? 'personal']); // Use organization ID or 'personal' as a stable dependency
    var setSidebarChatTitle = (title: {id: string, name: string}) => {
        // Refresh the entire threads list from the server
        fetch("/api/threads")
            .then(res => res.json())
            .then(data => {
                setThreads({data: data, loaded: true});
            })
            .catch(error => {
                console.error("Failed to refresh threads:", error);
                // If refresh fails, update the title locally as a fallback
                const updatedThreads = threads.data.map(thread => 
                    thread.id === title.id ? { ...thread, name: title.name } : thread
                );
                setThreads({data: updatedThreads, loaded: true});
            });
    }
    return (
        <div style={{
            width: "100%",
            height: "calc(100vh - 50px)",
            backgroundColor: "#fafafa",
            padding: "15px",
            borderRight: "1px solid #e4e4e7",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
        }}>
            <SidebarItem style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e4e4e7",
            }} onClick={async () => {
                const thread = await createThread("New Chat");
                (window as any).dockViewApi?.addPanel({
                    component: "regularChat",
                    title: "New Chat",
                    id: thread.id,
                    tabComponent: "regularChat",
                    params: {
                        id: thread.id,
                        setSidebarChatTitle
                    }
                });
                setThreads({data: [...threads.data, thread], loaded: true});
            }}>
                <PlusIcon size={16} />
                New Chat
            </SidebarItem>
            <SidebarItem>
                <HomeIcon size={16} />
                Home
            </SidebarItem>
            <SidebarItem>
                <BotIcon size={16} />
                Agents
            </SidebarItem>
            {currentOrg.data !== null && (
                <SidebarItem>
                    <UsersIcon size={16} />
                    Users
                </SidebarItem>
            )}
            <SidebarItem onClick={() => {
                (window as any).dockViewApi.addPanel({
                    component: "library",
                    title: "Library",
                    id: "library_id_" + new Date().toISOString(),
                    tabComponent: "library",
                });
            }}>
                <LibraryIcon size={16} />
                Library
            </SidebarItem>
            <div style={{
                height: "2px",
                borderRadius: "2px",
                width: "100%",
                marginTop: "5px",
                backgroundColor: "#e4e4e7",
            }} />
            <div style={{
                marginTop: "10px",
                marginLeft: "12px",
                fontSize: "14px",
                color: "#666666",
                fontWeight: "500",
            }}> 
                Your Chats
            </div>
            {threads.data.length === 0 && (
                <div style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                }}> 
                    <MessageSquareDashedIcon size={25} />
                    <div style={{
                        fontSize: "16px",
                        color: "#666666",
                        fontWeight: "500",
                    }}>Nothing Here</div>
                    <div style={{
                        fontSize: "12px",
                        color: "#999",
                        fontWeight: "400",
                    }}>Start a chat using the + button above</div>
                </div>
            )}
            {sidebarThreadsView({orgid: currentOrg.data?.id, threads: threads.data, setSidebarChatTitle})}
        </div>
    )
}

export function SidebarItem({
    children,
    style,
    onClick,
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
    onClick?: () => void;
}) {
    return (
        <div className="sidebarItem" style={style} onClick={onClick}>
            {children}
        </div>
    )
}
    