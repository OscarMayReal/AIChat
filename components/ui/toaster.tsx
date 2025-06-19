"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()
  const { theme } = useTheme()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant }) => (
        <Toast
          key={id}
          variant={variant}
          className={`${
            theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}
        >
          <div className="grid gap-1">
            {title && <div className="font-medium">{title}</div>}
            {description && (
              <div className="text-sm opacity-90">{description}</div>
            )}
          </div>
          {action}
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
