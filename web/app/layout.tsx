'use client'

import './globals.css'
import { Toaster as UIToaster } from "@/components/ui/toaster"
import { Toaster } from "sonner"
import { RootProvider } from 'fumadocs-ui/provider';
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RootProvider>
            {children}
          </RootProvider>
          <UIToaster />
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}