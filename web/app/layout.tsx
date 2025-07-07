'use client'

import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { RootProvider } from 'fumadocs-ui/provider';
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <RootProvider>
          {children}
        </RootProvider>
        <Toaster />
      </body>
    </html>
  )
}