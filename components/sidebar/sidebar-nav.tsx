"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  Home,
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  ShoppingCart,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface NavItem {
  title: string
  href?: string
  icon: React.ReactNode
  submenu?: {
    title: string
    href: string
    icon: React.ReactNode
  }[]
}

export function SidebarNav() {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const isActive = (href: string) => pathname === href

  const navItems: NavItem[] = [
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
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          title: "Reports",
          href: "/analytics/reports",
          icon: <FileText className="h-4 w-4" />,
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
          icon: <ShoppingCart className="h-4 w-4" />,
        },
        {
          title: "Categories",
          href: "/products/categories",
          icon: <FileText className="h-4 w-4" />,
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
    <nav className="space-y-1 p-2">
      {navItems.map((item) => (
        <div key={item.title} className="py-1">
          {item.submenu ? (
            <Collapsible open={openItems[item.title]} onOpenChange={() => toggleItem(item.title)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                <div className="flex items-center">
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </div>
                {openItems[item.title] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
              <span className="ml-3">{item.title}</span>
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
