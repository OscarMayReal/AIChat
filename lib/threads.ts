import { useState } from "react";
import { Project, Thread } from "@/app/generated/prisma";

export function useThreads(): {data: Thread[], loaded: boolean, refresh: () => void} {
    var reload = () => {
        setThreads({data: threads.data, loaded: false, refresh: reload});
    }
    const [threads, setThreads] = useState<{data: Thread[], loaded: boolean, refresh: () => void}>({data: [], loaded: false, refresh: reload});
    if (!threads.loaded) {
        fetch("/api/threads").then(res => res.json()).then(data => {
            setThreads({data: data, loaded: true, refresh: reload});
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

export function useArchivedThreads(): {data: Thread[], loaded: boolean, refresh: () => void} {
    var reload = () => {
        setThreads({data: threads.data, loaded: false, refresh: reload});
    }
    const [threads, setThreads] = useState<{data: Thread[], loaded: boolean, refresh: () => void}>({data: [], loaded: false, refresh: reload});
    if (!threads.loaded) {
        fetch("/api/threads").then(res => res.json()).then((data: Thread[]) => {
            setThreads({data: data.filter(thread => thread.archived), loaded: true, refresh: reload});
        });
    }
    return threads;
}

export function useProjectThreads(projectId: string): {data: Thread[], loaded: boolean, refresh: () => void} {
    var reload = () => {
        setThreads({data: threads.data, loaded: false, refresh: reload});
    }
    const [threads, setThreads] = useState<{data: Thread[], loaded: boolean, refresh: () => void}>({data: [], loaded: false, refresh: reload});
    if (!threads.loaded) {
        fetch(`/api/threads/project?projectId=${projectId}`).then(res => res.json()).then(data => {
            setThreads({data: data, loaded: true, refresh: reload});
        });
    }
    return threads;
}

export function useOrganizationThreads(): {data: Thread[], loaded: boolean, refresh: () => void} {
    var reload = () => {
        setThreads({data: threads.data, loaded: false, refresh: reload});
    }
    const [threads, setThreads] = useState<{data: Thread[], loaded: boolean, refresh: () => void}>({data: [], loaded: false, refresh: reload});
    if (!threads.loaded) {
        fetch("/api/threads/organization").then(res => res.json()).then(data => {
            setThreads({data: data, loaded: true, refresh: reload});
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

export async function createProjectThread(name: string, project: Project): Promise<Thread> {
    const response = await fetch(`/api/threads/project?projectId=${project.id}`, {
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

export async function archiveThread(thread: Thread): Promise<{ success: boolean; error?: string }> {
    console.log('[archiveThread] Starting archiving for thread:', thread.id);
    
    try {
        const url = `/api/threads/${thread.id}`;
        console.log('[archiveThread] Sending PATCH request to:', url);
        
        const response = await fetch(url, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ archived: !thread.archived, name: thread.name }),
        });

        console.log('[archiveThread] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[archiveThread] Error response:', errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }
            const errorMsg = errorData.error || `Failed to archive thread (${response.status} ${response.statusText})`;
            return { 
                success: false, 
                error: errorMsg
            };
        }

        console.log('[archiveThread] Thread archived successfully');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('[archiveThread] Error:', errorMessage, error);
        return { 
            success: false, 
            error: errorMessage
        };
    }
}

export async function moveThreadToOrganization(thread: Thread): Promise<{ success: boolean; error?: string }> {
    console.log('[moveThreadToOrganization] Starting moving for thread:', thread.id);
    
    try {
        const url = `/api/threads/${thread.id}`;
        console.log('[moveThreadToOrganization] Sending PATCH request to:', url);
        
        const response = await fetch(url, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ organizationPublic: !thread.organizationPublic, name: thread.name }),
        });

        console.log('[moveThreadToOrganization] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[moveThreadToOrganization] Error response:', errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }
            const errorMsg = errorData.error || `Failed to move thread (${response.status} ${response.statusText})`;
            return { 
                success: false, 
                error: errorMsg
            };
        }

        console.log('[moveThreadToOrganization] Thread moved successfully');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('[moveThreadToOrganization] Error:', errorMessage, error);
        return { 
            success: false, 
            error: errorMessage
        };
    }
}
