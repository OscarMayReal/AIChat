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
import { RegularChat, Watermark, LibraryPage } from '@/components/chatviews';
import { authClient } from '@/lib/auth-client';
import { RedirectToSignIn, SignedIn, SignedOut } from '@daveyplate/better-auth-ui';
import { LibraryIcon, MessageSquareIcon, XIcon } from 'lucide-react';

type RegularChatProps = {
    id: string;
}

const components = {
    regularChat: (props: IDockviewPanelProps<RegularChatProps>) => {
        return (
            <RegularChat id={props.params.id} />
        )
    },
    library: (props: IDockviewPanelProps) => {
        return (
            <LibraryPage />
        )
    }
}

const tabComponents = {
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
