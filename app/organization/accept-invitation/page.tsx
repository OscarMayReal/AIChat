"use client"

import { Header } from "@/components/header"

import {SparkleIcon} from "lucide-react"
import { usePathname } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { RedirectToSignIn, SignedIn, SignedOut, AcceptInvitationCard, AuthCard} from "@daveyplate/better-auth-ui"

export default function AcceptInvitation() {
    var session = authClient.getSession();
    var pathname = usePathname();
    var alignItems = "flex-start";
    var height = "calc(100vh - 50px)";
    if ((pathname.includes("sign-in") || pathname.includes("sign-up")) || pathname.includes("accept-invitation")) {
        alignItems = "center";
        height = "100vh";
    }
    
    return (
        <>
            <SignedIn>
                <>
                    {pathname.includes("sign-in") || pathname.includes("sign-up") ? null : (
                        <Header sidebarOpen={[false, () => {}]} hideSidebar={true} />
                    )}
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: alignItems,
                        justifyContent: "center",
                        height: height,
                        width: "100%",
                        padding: "40px",
                    }}>
                        {pathname.includes("sign-in") || pathname.includes("sign-up") ? <div style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "25px",
                        }}>
                            <div style={{
                                height: 35,
                                width: 35,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "8px",
                                backgroundColor: "#983DFF",
                                marginLeft: "15px",
                            }}>
                                <SparkleIcon size={25} color="#fff" />
                            </div>
                            <div
                                style={{
                                    marginLeft: "12px",
                                    fontSize: "25px",
                                }}
                            >
                                AIChat
                            </div>
                        </div> : null}
                        <AcceptInvitationCard />
                    </div>
                </>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </>
    )
}