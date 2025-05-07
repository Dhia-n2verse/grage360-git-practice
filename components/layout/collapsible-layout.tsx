"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import { cn } from "@/lib/utils"
import { Home, Users, Settings, ShoppingCart, BarChart3 } from "lucide-react"

interface CollapsibleLayoutProps {
  children: React.ReactNode
}

export function CollapsibleLayout({ children }: CollapsibleLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      submenu: [
        {
          title: "Overview",
          href: "/analytics",
        },
        {
          title: "Reports",
          href: "/analytics/reports",
        },
      ],
    },
    {
      title: "Customers",
      href: "/customers",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Products",
      icon: <ShoppingCart className="h-5 w-5" />,
      submenu: [
        {
          title: "All Products",
          href: "/products",
        },
        {
          title: "Categories",
          href: "/products/categories",
        },
      ],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <CollapsibleSidebar navItems={navItems} defaultOpen={sidebarOpen} />

      <main
        className={cn("transition-all duration-300 ease-in-out", sidebarOpen ? "ml-64" : isMobile ? "ml-0" : "ml-20")}
      >
        <div className="container mx-auto p-4">{children}</div>
      </main>
    </div>
  )
}
