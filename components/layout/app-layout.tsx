"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { RoleBasedSidebar } from "@/components/role-based-sidebar"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import { FloatingSwitchUserButton } from "@/components/floating-switch-user-button"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Toggle sidebar for mobile view
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev)
  }

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector(".app-sidebar")
      const toggleButton = document.querySelector(".sidebar-toggle-button")

      if (
        sidebar &&
        window.innerWidth < 640 &&
        sidebarOpen &&
        !sidebar.contains(event.target as Node) &&
        !toggleButton?.contains(event.target as Node)
      ) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [sidebarOpen])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 640) {
      setSidebarOpen(false)
    }
  }, [router])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  // Show loading state or nothing while checking auth
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  // Don't render the layout if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="app-layout">
      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <RoleBasedSidebar />
      </aside>
      <header className="app-header">
        <AppHeader onToggleSidebar={toggleSidebar} />
      </header>
      <main className="app-main">{children}</main>
      <FloatingSwitchUserButton />
    </div>
  )
}
