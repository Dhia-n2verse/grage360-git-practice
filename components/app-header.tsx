"use client"
import { Bell, Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/app/context/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { MessagingDropdown } from "@/components/messaging/messaging-dropdown"

interface AppHeaderProps {
  onToggleSidebar?: () => void
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const { user } = useAuth()

  return (
    <div className="flex h-full items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="sidebar-toggle-button md:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-[200px] rounded-md pl-8 md:w-[240px] lg:w-[320px]"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <MessagingDropdown />
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Avatar className="h-8 w-8">
          {user?.image ? (
            <AvatarImage src={user.image || "/placeholder.svg"} alt={user?.name || "User"} />
          ) : (
            <AvatarFallback>{getInitials(user?.name || "U")}</AvatarFallback>
          )}
        </Avatar>
      </div>
    </div>
  )
}
