import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
  } from "@/components/ui/command"
import { createThread, openArchivedChats, openThread, useOrganizationThreads, useThreads } from "@/lib/threads";
import { MessageSquare, MessageSquarePlusIcon, PanelLeftIcon, PanelRightIcon, PanelBottomIcon, PanelTopIcon, XIcon, TextIcon, LibraryIcon, FolderOpenIcon, UsersIcon, ArchiveIcon } from "lucide-react";
import * as React from 'react'
import { DockviewApi } from "dockview-react";
import { openProject, openProjectLibrary, useProjects } from "@/lib/projects";
import { openPromptsLibrary } from "@/lib/prompts";

// Extend the Window interface to include our custom properties
declare global {
  interface Window {
    setCommandBarOpen: () => void;
    dockviewApi?: DockviewApi; // Using the imported DockviewApi type
  }
}

export function CommandBar() {
    const [open, setOpen] = React.useState(false)
    var chats = useThreads()
    var orgChats = useOrganizationThreads()
    var projects = useProjects()

    window.setCommandBarOpen = () => setOpen(!open);
  
    React.useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          setOpen((open) => !open)
        }
      }
      document.addEventListener("keydown", down)
      return () => document.removeEventListener("keydown", down)
    }, [])

    var dockViewApiholder = (window as any).dockViewApi;
    var dockViewApi = dockViewApiholder as DockviewApi;
  
    return (
      <CommandDialog open={open} onOpenChange={setOpen} className="command-dialog">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={async () => {
                setOpen(false);
                const thread = await createThread("New Chat");
                (window as any).dockViewApi?.addPanel({
                    component: "regularChat",
                    title: "New Chat",
                    id: thread.id,
                    tabComponent: "regularChat",
                    params: {
                        id: thread.id,
                        setSidebarChatTitle: () => {
                            
                        }
                    }
                });
            }}><MessageSquarePlusIcon size={16} color="#666666" /> Create Chat</CommandItem>
          </CommandGroup>
          {dockViewApi?.panels.length !== undefined && dockViewApi.panels.length > 0 && (
            <CommandGroup heading="Panel Actions">
                <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                    setOpen(false);
                    dockViewApi.activePanel?.api.close();
                }}><XIcon size={16} color="#666666" /> Close</CommandItem>
                <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                    setOpen(false);
                    var activePanel = dockViewApi.activePanel;
                    var group = dockViewApi.addGroup({
                        direction: "left",
                    });
                    activePanel?.api.moveTo({
                        group: group,
                        index: 0,
                    });
                }}><PanelLeftIcon size={16} color="#666666" /> Split Left</CommandItem>
                <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                    setOpen(false);
                    var activePanel = dockViewApi.activePanel;
                    var group = dockViewApi.addGroup({
                        direction: "right",
                    });
                    activePanel?.api.moveTo({
                        group: group,
                        index: 0,
                    });
                }}><PanelRightIcon size={16} color="#666666" /> Split Right</CommandItem>
                <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                    setOpen(false);
                    var activePanel = dockViewApi.activePanel;
                    var group = dockViewApi.addGroup({
                        direction: "below",
                    });
                    activePanel?.api.moveTo({
                        group: group,
                        index: 0,
                    });
                }}><PanelBottomIcon size={16} color="#666666" /> Split Bottom</CommandItem>
                <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                    setOpen(false);
                    var activePanel = dockViewApi.activePanel;
                    var group = dockViewApi.addGroup({
                        direction: "above",
                    });
                    activePanel?.api.moveTo({
                        group: group,
                        index: 0,
                    });
                }}><PanelTopIcon size={16} color="#666666" /> Split Top</CommandItem>
                <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                    setOpen(false);
                    dockViewApi.closeAllGroups();
                }}><XIcon size={16} color="#666666" /> Close All Panels</CommandItem>
            </CommandGroup>
          )}
          {dockViewApi?.panels.length !== undefined && dockViewApi.panels.length > 0 && (
            <CommandGroup heading="Open Panels">
                {dockViewApi.panels.map((panel) => (
                    <CommandItem key={panel.id} style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                        setOpen(false);
                        panel.api.setActive();
                    }}>
                        {panel.api.component == "regularChat" && <MessageSquare size={16} color="#666666" />}
                        {panel.api.component == "promptEditor" && <TextIcon size={16} color="#666666" />}
                        {panel.api.component == "library" && <LibraryIcon size={16} color="#666666" />}
                        {panel.api.component == "projectPage" && <FolderOpenIcon size={16} color="#666666" />}
                        {panel.api.component == "projectLibrary" && <FolderOpenIcon size={16} color="#666666" />}
                        {panel.api.component == "organizationThreadsPage" && <UsersIcon size={16} color="#666666" />}
                        {panel.api.component == "archivedThreadsPage" && <ArchiveIcon size={16} color="#666666" />}
                        {panel.api.component == "members" && <UsersIcon size={16} color="#666666" />}
                        {panel.api.component == "libraryPrompts" && <TextIcon size={16} color="#666666" />}
                        {panel.title} <span style={{color: "transparent", fontSize: "0px"}}>{"openpanel_" + panel.id}</span>
                    </CommandItem>
                ))}
            </CommandGroup>
          )}
          <CommandGroup heading="Your Chats">
            {chats.data?.map((chat) => (
                !chat.archived && !chat.organizationPublic && (
                    <CommandItem key={chat.id} style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                        setOpen(false);
                        openThread(chat);
                    }}>
                        <MessageSquare size={16} color="#666666" /> {chat.name} <span style={{color: "transparent", fontSize: "0px"}}>{"personalchat_" + chat.id}</span>
                    </CommandItem>
                )
            ))}
          </CommandGroup>
          <CommandGroup heading="Organization Chats">
            {orgChats.data?.map((chat) => (
              <CommandItem key={chat.id} style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                setOpen(false);
                openThread(chat);
              }}>
                <MessageSquare size={16} color="#666666" /> {chat.name} <span style={{color: "transparent", fontSize: "0px"}}>{"orgchat_" + chat.id}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Projects">
            {projects.data?.map((project) => (
              <CommandItem key={project.id} style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                setOpen(false);
                openProject(project);
              }}>
                <FolderOpenIcon size={16} color="#666666" /> {project.name} <span style={{color: "transparent", fontSize: "0px"}}>{"project_" + project.id}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Locations">
            <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                setOpen(false);
                (window as any).dockViewApi.addPanel({
                    component: "library",
                    title: "Library",
                    id: "library_id_" + new Date().toISOString(),
                    tabComponent: "library",
                });
            }}><LibraryIcon size={16} color="#666666" />Library</CommandItem>
            <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                setOpen(false);
                openProjectLibrary();
            }}><FolderOpenIcon size={16} color="#666666" />Projects</CommandItem>
            <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                setOpen(false);
                (window as any).dockViewApi.addPanel({
                    component: "members",
                    title: "Members",
                    id: "members_id_" + new Date().toISOString(),
                    tabComponent: "members",
                });
            }}><UsersIcon size={16} color="#666666" />Members</CommandItem>
            <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                setOpen(false);
                openArchivedChats()
            }}><ArchiveIcon size={16} color="#666666" />Archived</CommandItem>
            <CommandItem style={{padding: "6px 6px", color: "#666666"}} onSelect={() => {
                setOpen(false);
                openPromptsLibrary()
            }}><TextIcon size={16} color="#666666" />Prompts</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    )
  }