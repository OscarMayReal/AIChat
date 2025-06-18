import { useState } from "react";
import { Thread } from "@/app/generated/prisma";

export function useThreads(): {data: Thread[], loaded: boolean} {
    const [threads, setThreads] = useState<{data: Thread[], loaded: boolean}>({data: [], loaded: false});
    if (!threads.loaded) {
        fetch("/api/threads").then(res => res.json()).then(data => {
            setThreads({data: data, loaded: true});
        });
    }
    return threads;
}

export function openThread(thread: Thread, setSidebarChatTitle?: (title: {id: string, name: string}) => void): void {
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
}

export function useArchivedThreads(): {data: Thread[], loaded: boolean} {
    const [threads, setThreads] = useState<{data: Thread[], loaded: boolean}>({data: [], loaded: false});
    if (!threads.loaded) {
        fetch("/api/threads/archived").then(res => res.json()).then(data => {
            setThreads({data: data, loaded: true});
        });
    }
    return threads;
}

export function useProjectThreads(projectId: string): {data: Thread[], loaded: boolean} {
    const [threads, setThreads] = useState<{data: Thread[], loaded: boolean}>({data: [], loaded: false});
    if (!threads.loaded) {
        fetch(`/api/threads/project/${projectId}`).then(res => res.json()).then(data => {
            setThreads({data: data, loaded: true});
        });
    }
    return threads;
}

export function useOrganizationThreads(): {data: Thread[], loaded: boolean} {
    const [threads, setThreads] = useState<{data: Thread[], loaded: boolean}>({data: [], loaded: false});
    if (!threads.loaded) {
        fetch("/api/threads/organization").then(res => res.json()).then(data => {
            setThreads({data: data, loaded: true});
        });
    }
    return threads;
}

export function openArchivedChats(): void {
    const api = (window as any).dockViewApi;
    if (!api) return;

    const panelId = 'archived-chats';
    const existingPanel = api.getPanel(panelId);
    
    if (existingPanel) {
        existingPanel.focus();
    } else {
        api.addPanel({
            id: panelId,
            component: 'archivedChats',
            tabComponent: 'archivedChats',
            title: 'Archived Chats',
        });
    }
}

export function openOrganizationChats(): void {
    const api = (window as any).dockViewApi;
    if (!api) return;

    const panelId = 'organization-chats';
    const existingPanel = api.getPanel(panelId);
    
    if (existingPanel) {
        existingPanel.focus();
    } else {
        api.addPanel({
            id: panelId,
            component: 'organizationChats',
            tabComponent: 'organizationChats',
            title: 'Organization Chats',
        });
    }
}

export async function createThread(name: string): Promise<Thread> {
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

export const renameThread = async (threadId: string, newName: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[renameThread] Starting rename for thread:', { threadId, newName });
    try {
        const url = `/api/threads/${threadId}`;
        console.log('[renameThread] Sending PATCH request to:', url);
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newName }),
            credentials: 'include',
        });

        console.log('[renameThread] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[renameThread] Error response:', errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }
            return { 
                success: false, 
                error: errorData.error || `Failed to rename thread (${response.status} ${response.statusText})` 
            };
        }

        console.log('[renameThread] Rename successful');
        return { success: true };
    } catch (error) {
        console.error('[renameThread] Error:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Network error while renaming thread' 
        };
    }
};

export async function deleteThread(threadId: string): Promise<{ success: boolean; error?: string }> {
    console.log('[deleteThread] Starting deletion for thread:', threadId);
    
    try {
        const url = `/api/threads/${threadId}`;
        console.log('[deleteThread] Sending DELETE request to:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('[deleteThread] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[deleteThread] Error response:', errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }
            const errorMsg = errorData.error || `Failed to delete thread (${response.status} ${response.statusText})`;
            return { 
                success: false, 
                error: errorMsg
            };
        }
        
        console.log('[deleteThread] Thread deleted successfully');
        return { success: true };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('[deleteThread] Error:', errorMessage, error);
        return { 
            success: false, 
            error: errorMessage
        };
    }
}
