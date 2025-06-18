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
            <ProjectPage project={props.params.project} api={props.api} />
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
    const [project, setProject] = React.useState<ProjectPageProps['project'] | null>(props.params?.project || null);
    
    // Handle parameter updates and project changes
    React.useEffect(() => {
      // Update local state when parameters change
      const handleParametersChange = (event: { parameters: ProjectPageProps }) => {
        if (event?.parameters?.project) {
          setProject(event.parameters.project);
          props.api.setTitle(event.parameters.project.name || 'Project');
        }
      };
      
      // Listen for project updates from other components
      const handleProjectUpdate = (event: CustomEvent) => {
        if (event.detail?.projectId && (!project || event.detail.projectId === project.id)) {
          const updatedProject = { 
            ...(project || {}), 
            ...event.detail,
            name: event.detail.name,
            id: event.detail.projectId 
          };
          setProject(updatedProject);
          props.api.setTitle(event.detail.name);
          // Update the tab parameters to persist the change
          props.api.updateParameters({ project: updatedProject });
        }
      };
      
      // Set initial title from parameters
      if (props.params?.project?.name) {
        props.api.setTitle(props.params.project.name);
      } else {
        props.api.setTitle('Project');
      }
      
      // Set up event listeners
      const projectUpdatedListener = handleProjectUpdate as EventListener;
      window.addEventListener('project-updated', projectUpdatedListener);
      
      // Handle parameter changes with proper typing
      const parameterChangeHandler = (e: any) => {
        handleParametersChange({ parameters: e });
      };
      
      props.api.onDidParametersChange(parameterChangeHandler);
      
      // Cleanup function
      return () => {
        window.removeEventListener('project-updated', projectUpdatedListener);
        // Use the same function reference for cleanup
        props.api.onDidParametersChange(parameterChangeHandler);
      };
    }, [project?.id, props.api, props.params?.project]);
    
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '0 8px',
        gap: '8px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--dv-tab-active-text-color)',
          height: '100%',
          overflow: 'hidden',
          flex: 1,
        }}>
          <FolderOpenIcon size={14} style={{ flexShrink: 0 }} />
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'inline-block',
            lineHeight: '1.5',
          }} title={project?.name || 'Project'}>
            {project?.name || 'Project'}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            props.api.close();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--dv-inactivegroup-visiblepanel-tab-color)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '2px',
            flexShrink: 0,
            padding: 0,
            margin: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--dv-tab-active-background)';
            e.currentTarget.style.color = 'var(--dv-tab-active-text-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--dv-inactivegroup-visiblepanel-tab-color)';
          }}
          title="Close tab"
        >
          <XIcon size={12} />
        </button>
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
