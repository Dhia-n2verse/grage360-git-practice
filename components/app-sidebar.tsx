"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { useAuth } from "@/app/context/auth-context"
import { useBusiness } from "@/app/context/business-context"
import { Logo } from "@/app/components/logo"
import { Button } from "@/components/ui/button"

interface SidebarItemWithSubmenu {
  title: string
  icon: React.ElementType
  href?: string
  submenu?: { title: string; href: string }[]
}

export function AppSidebar() {
  const { user, logout } = useAuth()
  const { businessInfo } = useBusiness()
  const pathname = usePathname()
  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({})

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const businessName = businessInfo?.business_name || "iGarage360"

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[var(--header-height)] items-center border-b px-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="font-semibold">{businessName}</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">{/* Your sidebar content here */}</div>

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(user?.name || "U")}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user?.name || "Guest"}</span>
            <span className="truncate text-xs text-muted-foreground">{user?.role || "Not authenticated"}</span>
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
