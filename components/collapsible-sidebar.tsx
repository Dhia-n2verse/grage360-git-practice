"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Menu, X, ChevronRight, ChevronDown, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface NavItem {
  title: string
  href?: string
  icon: React.ReactNode
  submenu?: {
    title: string
    href: string
    icon?: React.ReactNode
  }[]
}

interface CollapsibleSidebarProps {
  navItems: NavItem[]
  defaultOpen?: boolean
}

export function CollapsibleSidebar({ navItems, defaultOpen = true }: CollapsibleSidebarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Toggle button for mobile */}
      <Button variant="ghost" size="icon" className="fixed left-4 top-4 z-50 md:hidden" onClick={toggleSidebar}>
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">{isOpen ? "Close sidebar" : "Open sidebar"}</span>
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 transform border-r bg-background transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <h2
            className={cn(
              "text-lg font-semibold transition-opacity",
              isOpen ? "opacity-100" : "opacity-0 md:opacity-0",
            )}
          >
            Dashboard
          </h2>
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={toggleSidebar}>
            {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <span className="sr-only">{isOpen ? "Collapse sidebar" : "Expand sidebar"}</span>
          </Button>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <div key={item.title} className="py-1">
              {item.submenu ? (
                <Collapsible
                  open={openSubmenus[item.title]}
                  onOpenChange={() => toggleSubmenu(item.title)}
                  className={cn(!isOpen && "md:hidden")}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                    <div className="flex items-center">
                      {item.icon}
                      <span className={cn("ml-3", !isOpen && "md:hidden")}>{item.title}</span>
                    </div>
                    {openSubmenus[item.title] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-6 mt-1 space-y-1 border-l pl-2">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.href}
                          className={cn(
                            "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                            isActive(subItem.href) ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                          )}
                        >
                          {subItem.icon}
                          <span className="ml-3">{subItem.title}</span>
                        </Link>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link
                  href={item.href || "#"}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                    isActive(item.href || "") ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {item.icon}
                  <span className={cn("ml-3", !isOpen && "md:hidden")}>{item.title}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isOpen && isMobile && <div className="fixed inset-0 z-30 bg-black/50" onClick={toggleSidebar} />}
    </>
  )
}
