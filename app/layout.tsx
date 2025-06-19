"use client"
import "allotment/dist/style.css";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Providers } from "./generated/providers";
import { Toaster } from "@/components/ui/toaster";

const figtree = Figtree({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: figtree.style.fontFamily,
          color: "#666666",
        }}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
