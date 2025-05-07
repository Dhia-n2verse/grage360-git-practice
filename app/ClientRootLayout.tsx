"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeColorProvider } from "@/components/theme-color-provider"
import { AuthProvider } from "@/app/context/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { AppLayout } from "@/components/layout/app-layout"
import { usePathname } from "next/navigation"
import { BusinessProvider } from "@/app/context/business-context"

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <ThemeColorProvider>
          <BusinessProvider>
            <ClientLayout>{children}</ClientLayout>
            <Toaster />
          </BusinessProvider>
        </ThemeColorProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

// Client component to handle conditional layout rendering
function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Check if the current path is an auth path
  const isAuthPath = pathname?.startsWith("/auth")

  // If it's an auth path, don't use the AppLayout
  if (isAuthPath) {
    return <>{children}</>
  }

  // Otherwise, use the AppLayout
  return <AppLayout>{children}</AppLayout>
}
