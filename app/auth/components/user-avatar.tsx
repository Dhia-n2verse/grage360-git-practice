"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  name: string
  role: string
  color: string
  onClick: () => void
  image?: string | null // Changed from avatarUrl to image
}

export function UserAvatar({ name, role, color, onClick, image }: UserAvatarProps) {
  // Get initials from name
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Button variant="outline" className="flex h-auto flex-col items-center justify-center gap-2 p-4" onClick={onClick}>
      <Avatar className="h-16 w-16">
        {image ? (
          <AvatarImage src={image || "/placeholder.svg"} alt={name} />
        ) : (
          <AvatarFallback className={cn("text-primary-foreground", color)}>{initials}</AvatarFallback>
        )}
      </Avatar>
      <div className="text-center">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{role}</div>
      </div>
    </Button>
  )
}
