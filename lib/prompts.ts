import { useState } from "react";
import { Prompt } from "@/app/generated/prisma";

export function usePersonalPrompts() {
    var reload = () => {
        setPrompts({data: [], loaded: false, refresh: reload});
    }
    var [prompts, setPrompts] = useState<{data: Prompt[], loaded: boolean, refresh: () => void}>({data: [], loaded: false, refresh: reload});
    if (!prompts.loaded) {
        fetch("/api/prompts/personal").then(res => res.json()).then(data => {
            setPrompts({data: data, loaded: true, refresh: reload});
        });
    }
    return prompts;
}

export function useOrganizationPrompts() {
    var reload = () => {
        setPrompts({data: [], loaded: false, refresh: reload});
    }
    var [prompts, setPrompts] = useState<{data: Prompt[], loaded: boolean, refresh: () => void}>({data: [], loaded: false, refresh: reload});
    if (!prompts.loaded) {
        fetch("/api/prompts/organization").then(res => {
            if (res.status !== 200) {
                setPrompts({data: [], loaded: true, refresh: reload});
            } else {
                res.json().then(data => {
                    setPrompts({data: data, loaded: true, refresh: reload});
                });
            }
        })
    }
    return prompts;
}

export async function DeletePrompt(prompt: Prompt) {
    var response = await fetch("/api/prompts/" + prompt.id, {
        method: "DELETE",
    });
    if (response.status !== 200) {
        throw new Error("Failed to delete prompt");
    }
    return response.json();
}

export function useProjectPrompts(projectId: string | null) {
    var reload = () => {
        setPrompts({data: [], loaded: false, refresh: reload});
    }
    var [prompts, setPrompts] = useState<{data: Prompt[], loaded: boolean, refresh: () => void}>({data: [], loaded: false, refresh: reload});
    if (!prompts.loaded && projectId !== null) {
        fetch("/api/prompts/project?projectId=" + projectId).then(res => {
            if (res.status !== 200) {
                setPrompts({data: [], loaded: true, refresh: reload});
            } else {
                res.json().then(data => {
                    setPrompts({data: data, loaded: true, refresh: reload});
                });
            }
        })
    }
    return prompts;
}

export async function createPersonalPrompt({name, description, content}: {name: string, description: string, content: string}): Promise<Prompt> {
    const response = await fetch("/api/prompts/personal", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({name, description, content}),
    });
    return response.json();
}

export async function createOrganizationPrompt({name, description, content}: {name: string, description: string, content: string}): Promise<Prompt> {
    const response = await fetch("/api/prompts/organization", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({name, description, content}),
    });
    return response.json();
}

export function getProjectPrompts(projectId: string) {
    return fetch("/api/prompts/project?projectId=" + projectId).then(res => res.json());
}

export function openPromptsLibrary() {
    (window as any).dockViewApi?.addPanel({
        component: "libraryPrompts",
        title: "Prompts",
        id: "library_prompts_id_" + new Date().toISOString(),
        tabComponent: "libraryPrompts",
    });
}

export function openPromptEditor(prompt: Prompt): void {
    var found = false;
    (window as any).dockViewApi.panels.forEach((panel: any) => {
        console.log(panel.id, "prompt_editor_id_" + prompt.id);
        if (panel.id === "prompt_editor_id_" + prompt.id) {
            console.log("Panel found");
            panel.focus();
            found = true;
            return;
        }
    });
    if (!found) {
        (window as any).dockViewApi?.addPanel({
            component: "promptEditor",
            title: prompt.name,
            id: "prompt_editor_id_" + prompt.id,
            tabComponent: "promptEditor",
            params: {
                prompt,
            }
        });
    }
}
    
export async function updatePrompt(prompt: Prompt): Promise<Prompt> {
    const response = await fetch("/api/prompts/" + prompt.id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(prompt),
    });
    return await response.json();
}