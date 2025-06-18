import { HomeIcon, UsersIcon, LibraryIcon, BotIcon, PlusIcon, SparkleIcon, MessageSquareDashedIcon, MessageSquareIcon, MessageSquareLockIcon, Trash2Icon, ShareIcon, EditIcon, MoreVertical } from "lucide-react"
import { useMutation, useQuery } from "convex/react";
import React, { useState, useEffect } from "react";
import { Thread } from "@/app/generated/prisma";
import { authClient } from "@/lib/auth-client";
import { deleteThread, renameThread } from "@/lib/threads";
import { useInputDialog } from "./ui/input-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface SidebarThreadsViewProps {
    orgid: string | undefined;
    threads: Thread[];
    setSidebarChatTitle: (title: {id: string, name: string}) => void;
    setThreads: React.Dispatch<React.SetStateAction<{data: Thread[], loaded: boolean}>>;
}

const sidebarThreadsView = ({ orgid, threads, setSidebarChatTitle, setThreads }: SidebarThreadsViewProps) => {
    const { showDialog, showConfirm } = useInputDialog();
    return threads.map(thread => (
        <div key={thread.id} style={{ position: 'relative', width: '100%' }}>
            <SidebarItem 
                onClick={() => {
                    let found = false;
                    (window as any).dockViewApi?.panels?.forEach?.((panel: any) => {
                        if (panel.id === thread.id) {
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
                }}
            >
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexDirection: "row",
                    maxWidth: "100%",
                    minWidth: "100%",
                }}>
                    {thread.public ? (
                        <MessageSquareIcon size={16} style={{ flexShrink: 0 }} />
                    ) : (
                        <MessageSquareLockIcon size={16} style={{ flexShrink: 0 }} />
                    )}
                    <div style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "calc(100% - 60px)",
                    }}>
                        {thread.name}
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button 
                                onClick={(e) => e.stopPropagation()}
                                className="hover:bg-gray-100 dark:hover:bg-gray-800"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#666',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    marginLeft: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px'
                                }}
                            >
                                <MoreVertical size={16} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="right">
                            <DropdownMenuItem
                                onClick={async (e) => {
                                    e.preventDefault();
                                    const result = await showConfirm({
                                        title: "Delete Thread",
                                        description: "Are you sure you want to delete this thread? This action cannot be undone.",
                                        variant: 'destructive'
                                    });
                                    
                                    if (!result) return;
                                    
                                    const { success, error } = await deleteThread(thread.id);
                                    
                                    if (success) {
                                        // First, close the tab if it's open
                                        if (typeof window !== 'undefined' && (window as any).dockViewApi) {
                                            const dockView = (window as any).dockViewApi;
                                            try {
                                                // Close the panel if it exists
                                                if (dockView.getPanel(thread.id)) {
                                                    dockView.removePanel(thread.id);
                                                    console.log(`Closed tab for thread ${thread.id}`);
                                                }
                                            } catch (error) {
                                                console.error('Error closing thread tab:', error);
                                                // Continue with deletion even if closing the tab fails
                                            }
                                        }
                                        
                                        try {
                                            // First close the tab if it's open
                                            if (typeof window !== 'undefined' && (window as any).dockViewApi) {
                                                const dockView = (window as any).dockViewApi;
                                                try {
                                                    // Close the panel if it exists
                                                    const panel = dockView.getPanel(thread.id);
                                                    if (panel) {
                                                        console.log(`Closing tab for thread ${thread.id}`);
                                                        panel.api.close();
                                                    }
                                                } catch (error) {
                                                    console.error('Error closing thread tab:', error);
                                                    // Continue with deletion even if closing the tab fails
                                                }
                                            }
                                            
                                            // Then update the UI state
                                            setThreads(prev => ({
                                                ...prev,
                                                data: prev.data.filter(t => t.id !== thread.id)
                                            }));
                                            
                                            // Clear the sidebar title if the deleted thread was selected
                                            setSidebarChatTitle({ id: "", name: "" });
                                            
                                            // Refresh the threads list from the server to ensure consistency
                                            try {
                                                const response = await fetch("/api/threads");
                                                const data = await response.json();
                                                setThreads({ data, loaded: true });
                                            } catch (refreshError) {
                                                console.error("Failed to refresh threads after deletion:", refreshError);
                                            }
                                        } catch (error) {
                                            console.error("Error during thread deletion:", error);
                                            throw error; // Re-throw to trigger the error handling in the catch block below
                                        }
                                    } else {
                                        await showConfirm({
                                            title: "Error",
                                            description: (() => {
                                                try {
                                                    return error && typeof error === 'object' && error !== null && 'message' in error
                                                        ? String((error as { message: unknown }).message)
                                                        : "Failed to delete the thread. Please try again.";
                                                } catch {
                                                    return "Failed to delete the thread. Please try again.";
                                                }
                                            })(),
                                            confirmText: "OK",
                                        });
                                    }
                                }}
                                className="text-red-600 focus:bg-red-50"
                            >
                                <Trash2Icon className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={async (e) => {
                                    e.preventDefault();
                                    const newName = await showDialog({
                                        title: "Rename Thread",
                                        description: "Enter a new name for this thread:",
                                        defaultValue: thread.name,
                                    });
                                    
                                    if (!newName || newName.trim() === thread.name) return;
                                    
                                    console.log('Attempting to rename thread:', { id: thread.id, newName: newName.trim() });
                                    const { success, error } = await renameThread(thread.id, newName.trim());
                                    console.log('Rename result:', { success, error });
                                    
                                    if (success) {
                                        setThreads(prev => ({
                                            ...prev,
                                            data: prev.data.map(t => 
                                                t.id === thread.id 
                                                    ? { ...t, name: newName.trim() } 
                                                    : t
                                            )
                                        }));
                                        
                                        // Update the panel title if it's open
                                        if ((window as any).dockViewApi) {
                                            (window as any).dockViewApi.panels.forEach((panel: any) => {
                                                if (panel.id === thread.id) {
                                                    panel.setTitle(newName.trim());
                                                }
                                            });
                                        }
                                    } else {
                                        await showConfirm({
                                            title: "Error",
                                            description: error || "Failed to rename the thread. Please try again.",
                                            confirmText: "OK"
                                        });
                                    }
                                }}
                                className="hover:bg-gray-100"
                            >
                                <EditIcon className="mr-2 h-4 w-4" />
                                <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <ShareIcon className="mr-2 h-4 w-4" />
                                <span>Share</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </SidebarItem>
        </div>
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
            overflowY: "scroll",
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
                <SidebarItem onClick={() => {
                    (window as any).dockViewApi.addPanel({
                        component: "members",
                        title: "Members",
                        id: "members_id_" + new Date().toISOString(),
                        tabComponent: "members",
                    });
                }}>
                    <UsersIcon size={16} />
                    Members
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
                flexShrink: 0,
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
            {sidebarThreadsView({
                orgid: currentOrg.data?.id,
                threads: threads.data,
                setSidebarChatTitle,
                setThreads
            })}
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
    