import { useState } from "react";
import { Project } from "@/app/generated/prisma";

declare global {
  interface Window {
    dockViewApi: any;
  }
}

export const useProjects = () => {
    var reload = () => {
        setProjects({data: [], loaded: false, refresh: reload});
    }
    var [projects, setProjects] = useState<{data: Project[], loaded: boolean, refresh: () => void}>({data: [], loaded: false, refresh: reload});
    if (!projects.loaded) {
        fetch("/api/projects").then(response => response.json()).then(data => {
            setProjects({data: data, loaded: true, refresh: reload});
        });
    }
    return projects;
}

export const openProjectLibrary = () => {
  if (typeof window !== 'undefined' && window.dockViewApi) {
    const panelId = 'project-library';
    const existingPanel = window.dockViewApi.panels.find((p: any) => p.id === panelId);
    
    if (!existingPanel) {
      window.dockViewApi.addPanel({
        component: "projectLibrary",
        title: "Projects",
        id: panelId,
        tabComponent: "projectLibrary",
        params: {}
      });
    } else {
      existingPanel.focus();
    }
  }
}

export const openProject = (project: any) => {
  if (typeof window !== 'undefined' && window.dockViewApi) {
    const panelId = `project-${project.id}`;
    const existingPanel = window.dockViewApi.panels.find((p: any) => p.id === panelId);
    
    if (!existingPanel) {
      window.dockViewApi.addPanel({
        component: "projectPage",
        title: project.name,
        id: panelId,
        tabComponent: "projectPage",
        params: { project }
      });
    } else {
      existingPanel.focus();
    }
  }
}
