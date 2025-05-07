"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, LogOut, Warehouse } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"
import { useAuth } from "@/app/context/auth-context"
import { Logo } from "@/app/components/logo"
import { getNavigationByRole } from "@/lib/navigation"
import { Button } from "@/components/ui/button"

interface RoleBasedSidebarProps {
  overrideRole?: string
}

export function RoleBasedSidebar({ overrideRole }: RoleBasedSidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({})

  // Get navigation items based on user role or override role
  const navigationItems = React.useMemo(
    () => getNavigationByRole(overrideRole || user?.role),
    [overrideRole, user?.role],
  )

  // Initialize open submenus based on current path
  React.useEffect(() => {
    if (!navigationItems) return

    const initialOpenSubmenus: Record<string, boolean> = {}

    // Open submenu if current path is in it or starts with it
    navigationItems.forEach((item) => {
      if (item.submenu) {
        const isSubmenuActive = item.submenu.some(
          (subItem) => pathname === subItem.href || pathname?.startsWith(subItem.href + "/"),
        )
        if (isSubmenuActive) {
          initialOpenSubmenus[item.title] = true
        }
      }
    })

    setOpenSubmenus(initialOpenSubmenus)
  }, [pathname, navigationItems])

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  // Check if a menu item is active
  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/")
  }

  if (!navigationItems || navigationItems.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-[var(--header-height)] items-center border-b px-4">
          <Link href="/">
            <Logo size="sm" linkEnabled={false} />
          </Link>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <p className="text-muted-foreground">No navigation items available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[var(--header-height)] items-center border-b px-4">
        <Link href="/">
          <Logo size="sm" linkEnabled={false} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <div key={item.title} className="py-1">
              {item.submenu ? (
                <Collapsible open={openSubmenus[item.title]} onOpenChange={() => toggleSubmenu(item.title)}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                    <div className="flex items-center">
                      {item.title.toLowerCase().includes("inventory") ||
                      item.title.toLowerCase().includes("stock") ||
                      item.title.toLowerCase().includes("supplier") ? (
                        <Warehouse className={cn("mr-3 h-5 w-5", item.color)} />
                      ) : (
                        <item.icon className={cn("mr-3 h-5 w-5", item.color)} />
                      )}
                      <span>{item.title}</span>
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
                          <subItem.icon className={cn("mr-3 h-4 w-4", subItem.color)} />
                          <span>{subItem.title}</span>
                        </Link>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                    isActive(item.href) ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", item.color)} />
                  <span>{item.title}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {user?.image ? (
              <AvatarImage src={user.image || "/placeholder.svg"} alt={user?.name || "User"} />
            ) : (
              <AvatarFallback>{getInitials(user?.name || "U")}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user?.name || "Guest"}</span>
            <span className="truncate text-xs text-muted-foreground">
              {overrideRole || user?.role || "Not authenticated"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="ml-auto rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
