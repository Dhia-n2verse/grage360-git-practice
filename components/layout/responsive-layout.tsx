"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ResponsiveLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export function ResponsiveLayout({ sidebar, children, defaultCollapsed = false }: ResponsiveLayoutProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [isMobile, setIsMobile] = useState(false)

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={cn(
        "grid h-screen transition-all duration-300 ease-in-out",
        collapsed ? "grid-cols-[0_1fr]" : isMobile ? "grid-cols-[280px_1fr]" : "grid-cols-[280px_1fr]",
      )}
    >
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 h-full w-[280px] overflow-y-auto border-r bg-background transition-all duration-300 ease-in-out",
          collapsed ? "-translate-x-full" : "translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setCollapsed(true)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
          <div className="flex-1">{sidebar}</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b px-4">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => setCollapsed(!collapsed)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">{collapsed ? "Open sidebar" : "Close sidebar"}</span>
          </Button>
          <h1 className="text-lg font-semibold">Content Area</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </main>

      {/* Overlay for mobile */}
      {!collapsed && isMobile && <div className="fixed inset-0 z-20 bg-black/50" onClick={() => setCollapsed(true)} />}
    </div>
  )
}
