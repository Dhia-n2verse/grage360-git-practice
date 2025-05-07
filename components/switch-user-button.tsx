"use client"

import type React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/types"

interface SwitchUserButtonProps {
  users: User[]
  selectedUser: User
  onUserChange: (user: User) => void
}

function getRoleColor(role: string) {
  switch (role) {
    case "admin":
      return "bg-red-500"
    case "editor":
      return "bg-green-500"
    case "viewer":
      return "bg-blue-500"
    default:
      return "bg-gray-500"
  }
}

const SwitchUserButton: React.FC<SwitchUserButtonProps> = ({ users, selectedUser, onUserChange }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center gap-2 cursor-pointer">
          <Avatar className="h-8 w-8">
            {selectedUser.image ? (
              <AvatarImage src={selectedUser.image || "/placeholder.svg"} alt={selectedUser.full_name} />
            ) : (
              <AvatarFallback>{selectedUser.full_name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <span>{selectedUser.full_name}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Switch User</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((profile) => (
          <DropdownMenuItem key={profile.id} onSelect={() => onUserChange(profile)}>
            <div className="grid w-full items-center gap-2">
              <Avatar className="h-16 w-16 mb-2">
                {profile.image ? (
                  <AvatarImage src={profile.image || "/placeholder.svg"} alt={profile.full_name} />
                ) : (
                  <AvatarFallback className={getRoleColor(profile.role)}>{profile.full_name.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <p className="text-sm font-medium leading-none">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SwitchUserButton
