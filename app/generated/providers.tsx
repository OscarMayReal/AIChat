"use client"

import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"

import { authClient } from "@/lib/auth-client"
import { DialogProvider } from "@/components/ui/input-dialog"

export function Providers({ children }: { children: ReactNode }) {
    const router = useRouter()

    return (
      <DialogProvider>
        <AuthUIProvider
            authClient={authClient}
            navigate={router.push}
            replace={router.replace}
            avatar={{
                upload: (file) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload = () => {
                            resolve(reader.result?.toString() || "")
                        }
                        reader.onerror = reject
                        reader.readAsDataURL(file)
                    })
                },
                extension: "png",
            }}
            onSessionChange={() => {
                // Clear router cache (protected routes)
                router.refresh()
            }}
            Link={Link}
            organization={{
                logo: {
                    upload: (file) => {
                        return new Promise((resolve, reject) => {
                            const reader = new FileReader()
                            reader.onload = () => {
                                resolve(reader.result?.toString() || "")
                            }
                            reader.onerror = reject
                            reader.readAsDataURL(file)
                        })
                    },
                    extension: "png",
                },
            }}
        >
            {children}
        </AuthUIProvider>
      </DialogProvider>
    )
}