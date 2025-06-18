"use client"
import { useChat } from '@ai-sdk/react';
import "dockview-react/dist/styles/dockview.css";
import { themeLight } from "dockview";
import React from "react";
import { Shell } from "@/components/shell";

import { useEffect } from "react";

import {
  DockviewApi,
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
  IDockviewPanelHeaderProps,
} from 'dockview';
import { RegularChat, Watermark, LibraryPage, MembersPage, LibraryPrompts, PromptEditor, ProjectLibrary, ProjectPage, ArchivedThreadsPage, OrganizationThreadsPage } from '@/components/chatviews';
import { authClient } from '@/lib/auth-client';
import { RedirectToSignIn, SignedIn, SignedOut } from '@daveyplate/better-auth-ui';
import { ArchiveIcon, FolderOpenIcon, LibraryIcon, MessageSquareIcon, TextIcon, UsersIcon, XIcon } from 'lucide-react';
import { Prompt } from './generated/prisma';

type RegularChatProps = {
    id: string;
}

type PromptEditorProps = {
    prompt: Prompt;
}

type ProjectPageProps = {
    project: any;
}

const components = {
    regularChat: (props: IDockviewPanelProps<RegularChatProps>) => {
        return (
            <RegularChat id={props.params.id} />
        )
    },
    promptEditor: (props: IDockviewPanelProps<PromptEditorProps>) => {
        return (
            <PromptEditor prompt={props.params.prompt} />
        )
    },
    projectPage: (props: IDockviewPanelProps<ProjectPageProps>) => {
        return (
            <ProjectPage project={props.params.project} />
        )
    },
    library: (props: IDockviewPanelProps) => {
        return (
            <LibraryPage />
        )
    },
    members: (props: IDockviewPanelProps) => {
        return (
            <MembersPage />
        )
    },
    libraryPrompts: (props: IDockviewPanelProps) => {
        return (
            <LibraryPrompts panelapi={props.api} />
        )
    },
    projectLibrary: (props: IDockviewPanelProps) => {
        return (
            <ProjectLibrary />
        )
    },
    archivedChats: (props: IDockviewPanelProps) => {
        return (
            <ArchivedThreadsPage />
        )
    },
    organizationChats: (props: IDockviewPanelProps) => {
        return (
            <OrganizationThreadsPage />
        )
    }
}

const tabComponents = {
  projectPage: (props: IDockviewPanelHeaderProps<ProjectPageProps>) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0 10px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#3f3f46',
            }}>
                <FolderOpenIcon size={14} />
                <span>{props.params.project?.name || 'Project'}</span>
            </div>
            <div className="group">
                <XIcon
                    size={14}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        props.api.close();
                    }}
                />
            </div>
        </div>
    );
  },
  projectLibrary: (props: IDockviewPanelHeaderProps) => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '5px',
        height: '100%',
        width: '100%',
        marginLeft: '5px',
        marginRight: '5px',
      }}>
        <FolderOpenIcon size={16} />
        <div>Projects</div>
        <XIcon 
          size={16} 
          style={{
            flexShrink: 0,
            marginLeft: '5px',
            cursor: 'pointer',
          }} 
          onClick={(e) => {
            e.stopPropagation();
            props.api.close();
          }} 
        />
      </div>
    );
  },
  regularChat: (props: IDockviewPanelHeaderProps<RegularChatProps>) => {
    var [title, setTitle] = React.useState(props.api.title);
    props.api.onDidTitleChange(() => {
      setTitle(props.api.title);
    });
    return (
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "5px",
          height: "100%",
          width: "100%",
          marginLeft: "5px",
          marginRight: "5px",
        }}>
          <MessageSquareIcon size={16} />
          <div>{title}</div>
          <XIcon size={16} style={{
              flexShrink: 0,
              marginLeft: "5px",
              cursor: "pointer",
          }} onClick={() => {
              props.api.close();
          }} />
        </div>
      );
  },
  promptEditor: (props: IDockviewPanelHeaderProps<PromptEditorProps>) => {
    var [title, setTitle] = React.useState(props.api.title);
    props.api.onDidTitleChange(() => {
      setTitle(props.api.title);
    });
    return (
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "5px",
          height: "100%",
          width: "100%",
          marginLeft: "5px",
          marginRight: "5px",
        }}>
          <TextIcon size={16} />
          <div>{title}</div>
          <XIcon size={16} style={{
              flexShrink: 0,
              marginLeft: "5px",
              cursor: "pointer",
          }} onClick={() => {
              props.api.close();
          }} />
        </div>
      );
  },
  library: (props: IDockviewPanelHeaderProps) => {
      return (
          <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "5px",
            height: "100%",
            width: "100%",
            marginLeft: "5px",
            marginRight: "5px",
          }}>
            <LibraryIcon size={16} />
            <div>Library</div>
            <XIcon size={16} style={{
                flexShrink: 0,
                marginLeft: "5px",
                cursor: "pointer",
            }} onClick={() => {
                props.api.close();
            }} />
          </div>
      );
  },
  members: (props: IDockviewPanelHeaderProps) => {
    return (
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "5px",
          height: "100%",
          width: "100%",
          marginLeft: "5px",
          marginRight: "5px",
        }}>
          <UsersIcon size={16} />
          <div>Members</div>
          <XIcon size={16} style={{
              flexShrink: 0,
              marginLeft: "5px",
              cursor: "pointer",
          }} onClick={() => {
              props.api.close();
          }} />
        </div>
      );
  },
  libraryPrompts: (props: IDockviewPanelHeaderProps) => {
    return (
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "5px",
          height: "100%",
          width: "100%",
          marginLeft: "5px",
          marginRight: "5px",
        }}>
          <LibraryIcon size={16} />
          <div>Prompts</div>
          <XIcon size={16} style={{
              flexShrink: 0,
              marginLeft: "5px",
              cursor: "pointer",
          }} onClick={() => {
              props.api.close();
          }} />
        </div>
      );
  },
  archivedChats: (props: IDockviewPanelHeaderProps) => {
    return (
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "5px",
          height: "100%",
          width: "100%",
          marginLeft: "5px",
          marginRight: "5px",
        }}>
          <ArchiveIcon size={16} />
          <div>Archived Chats</div>
          <XIcon size={16} style={{
              flexShrink: 0,
              marginLeft: "5px",
              cursor: "pointer",
          }} onClick={() => {
              props.api.close();
          }} />
        </div>
      );
  },
  organizationChats: (props: IDockviewPanelHeaderProps) => {
    return (
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "5px",
          height: "100%",
          width: "100%",
          marginLeft: "5px",
          marginRight: "5px",
        }}>
          <UsersIcon size={16} />
          <div>Organization Chats</div>
          <XIcon size={16} style={{
              flexShrink: 0,
              marginLeft: "5px",
              cursor: "pointer",
          }} onClick={() => {
              props.api.close();
          }} />
        </div>
      );
  },
};

async function onReady(event: DockviewReadyEvent) {
  const session = await authClient.getSession();
  if (!session.data?.session) return;
  
  const orgId = session.data.session.activeOrganizationId || "personal";
  
  // Initialize layouts if not exists
  const layouts = JSON.parse(localStorage.getItem("layouts") || "{}");
  if (!layouts[orgId]) {
    layouts[orgId] = { layout: null };
    localStorage.setItem("layouts", JSON.stringify(layouts));
  }
  
  // Load saved layout if exists and valid
  const savedLayout = layouts[orgId]?.layout;
  if (savedLayout) {
    try {
      await event.api.fromJSON(savedLayout);
    } catch (error) {
      console.error('Error loading layout:', error);
      event.api.clear();
    }
  } else {
    event.api.clear();
  }
}

function DockviewWrapper() {
  const activeOrg = authClient.useActiveOrganization();
  const orgId = activeOrg.data?.id || "personal";
  const [key, setKey] = React.useState(0);
  const prevOrgId = React.useRef(orgId);

  // Log organization changes and force remount
  React.useEffect(() => {
    console.log('Current organization:', { orgId, activeOrg });
    
    if (prevOrgId.current !== orgId) {
      console.log('Organization changed from', prevOrgId.current, 'to', orgId);
      prevOrgId.current = orgId;
      
      // Force a complete remount when organization changes
      setKey(prev => {
        const newKey = prev + 1;
        console.log('Remounting dockview with new key:', newKey);
        return newKey;
      });
    }
  }, [orgId, activeOrg]);

  const handleReady = async (event: DockviewReadyEvent) => {
    (window as any).dockViewApi = event.api;
    
    try {
      // Load the layout for the current organization
      const layouts = JSON.parse(localStorage.getItem("layouts") || "{}");
      if (!layouts[orgId]) {
        layouts[orgId] = { layout: null };
        localStorage.setItem("layouts", JSON.stringify(layouts));
      }
      
      const savedLayout = layouts[orgId]?.layout;
      if (savedLayout) {
        await event.api.fromJSON(savedLayout);
      } else {
        event.api.clear();
      }
      
      // Save layout on change
      event.api.onDidLayoutChange(() => {
        try {
          const layout = event.api.toJSON();
          const updatedLayouts = JSON.parse(localStorage.getItem("layouts") || "{}");
          updatedLayouts[orgId] = { layout };
          localStorage.setItem("layouts", JSON.stringify(updatedLayouts));
        } catch (error) {
          console.error('Error saving layout:', error);
        }
      });
    } catch (error) {
      console.error('Error initializing dockview:', error);
      event.api.clear();
    }
  };

  return (
    <DockviewReact
      key={`dockview-${key}`}
      watermarkComponent={Watermark}
      className="dockview-container"
      theme={themeLight}
      onReady={handleReady}
      components={components}
      tabComponents={tabComponents}
      disableTabsOverflowList={true}
    />
  );
}

export default function Home() {
  return (
    <>
      <SignedIn>
        <Shell>
          <DockviewWrapper />
        </Shell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
