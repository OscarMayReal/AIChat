import { MessageSquareXIcon, PanelLeftIcon, SearchIcon, SparkleIcon } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { OrganizationSwitcher, UserButton } from "@daveyplate/better-auth-ui"
import { TeamSwitcher } from "./org-switcher"
import { DockviewApi } from "dockview-react"

export function HeaderIcon() {
    return (
        <div style={{
            height: 25,
            width: 25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "5px",
            backgroundColor: "#983DFF",
            marginLeft: "15px",
        }}>
            <SparkleIcon size={18} color="#fff" />
        </div>
    )
}

export function UserAvatar() {
    return (
        <div style={{
            marginRight: "15px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "15px",
        }}>
            <UserButton size="icon" />
        </div>
    )
}

export function HeaderSearch() {
    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40%",
            height: "30px",
            borderRadius: "5px",
            // backgroundColor: "#fff",
            backgroundColor: "rgba(0, 0, 0, 0.05)",
            border: "1px solid #e4e4e7",
            position: "fixed",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            // zIndex: 1000,
        }} onClick={() => {
            (window as any).setCommandBarOpen()
        }}>
            <SearchIcon size={16} />
            <div style={{
                marginLeft: "12px",
                fontSize: "14px",
            }}>
                Search AIChat
            </div>
        </div>
    )
}

export function Header({
    sidebarOpen,
    hideSidebar,
}: {
    sidebarOpen: [boolean, (value: boolean) => void];
    hideSidebar?: boolean;
}) {
    return (
        <header
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                height: "50px",
                backgroundColor: "#fafafa",
                borderBottom: "1px solid #e4e4e7",
            }}
        >
            {hideSidebar != true && (
                <PanelLeftIcon
                        style={{
                            marginLeft: "15px",
                            cursor: "pointer",
                        }}
                        size={18}
                    onClick={() => {
                        sidebarOpen[1](!sidebarOpen[0]);
                    }}
                />
            )}
            <div style={{
                display: "flex",
                alignItems: "center"
            }} onClick={() => {
                if (window.location.pathname !== "/") {
                    window.location.pathname = "/";
                }
            }}>
                <HeaderIcon />
                <div
                    style={{
                        marginLeft: "12px",
                    }}
                >
                    AIChat
                </div>
            </div>
            <div style={{
                color: "#999999",
                marginLeft: "12px",
                marginRight: "8px",
            }}>
                /
            </div>
            <OrganizationSwitcher style={{
                backgroundColor: "transparent",
                color: "#666666",
                boxShadow: "none",
            }} size="sm" />
            <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }} >
                {hideSidebar != true && (
                    <HeaderSearch />
                )}
            </div>
            {hideSidebar != true && (
                <MessageSquareXIcon
                    style={{
                        marginRight: "15px",
                        cursor: "pointer",
                    }}
                    size={18}
                    onClick={() => {
                        (window as any).dockViewApi.clear();
                    }}
                />
            )}
            <UserAvatar />
        </header>
    )
}
