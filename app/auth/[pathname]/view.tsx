"use client"

import { Header } from "@/components/header"
import { AuthCard } from "@daveyplate/better-auth-ui"

import {SparkleIcon} from "lucide-react"

export function AuthView({ pathname }: { pathname: string }) {
    var alignItems = "flex-start";
    var height = "calc(100vh - 50px)";
    if (pathname.includes("sign-in") || pathname.includes("sign-up")) {
        alignItems = "center";
        height = "100vh";
        localStorage.removeItem("layouts");
    }
    
    return (
        <>
            {pathname.includes("sign-in") || pathname.includes("sign-up") ? null : (
                <Header sidebarOpen={[false, () => {}]} hideSidebar={true} />
            )}
            <main style={{
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
                <AuthCard pathname={pathname} />
            </main>
        </>
    )
}