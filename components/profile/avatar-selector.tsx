"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Check, UserCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getInitials } from "@/lib/utils"

interface DefaultAvatarSelectorProps {
  currentImage: string | null // Make sure this matches the field name in your profiles table
  userName: string
  onSelect: (imageUrl: string) => void
}

export function DefaultAvatarSelector({ currentImage, userName, onSelect }: DefaultAvatarSelectorProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatars, setAvatars] = useState<{ name: string; url: string }[]>([])
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)

  // Fetch avatars from the public avatar bucket
  useEffect(() => {
    if (isOpen) {
      fetchAvatars()
    }
  }, [isOpen])

  const fetchAvatars = async () => {
    setIsLoading(true)
    try {
      // List all files in the avatar bucket
      const { data, error } = await supabase.storage.from("avatar").list()

      if (error) {
        throw error
      }

      // Get public URLs for each avatar
      const avatarList = await Promise.all(
        data
          .filter((file) => !file.name.startsWith(".")) // Filter out hidden files
          .map(async (file) => {
            const { data: urlData } = supabase.storage.from("avatar").getPublicUrl(file.name)
            return {
              name: file.name,
              url: urlData.publicUrl,
            }
          }),
      )

      setAvatars(avatarList)
    } catch (error) {
      console.error("Error fetching avatars:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load avatars. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAvatar = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar)
      setIsOpen(false)
      toast({
        title: "Avatar Selected",
        description: "Your profile picture has been updated.",
      })
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="flex items-center gap-2">
        <UserCircle className="h-4 w-4" />
        Choose Default Avatar
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose an Avatar</DialogTitle>
            <DialogDescription>Select one of our default avatars for your profile picture.</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 py-4 md:grid-cols-4">
              {avatars.map((avatar) => (
                <div
                  key={avatar.name}
                  className={`relative cursor-pointer rounded-md p-2 hover:bg-muted ${
                    selectedAvatar === avatar.url ? "bg-muted ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedAvatar(avatar.url)}
                >
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarImage src={avatar.url || "/placeholder.svg"} alt={avatar.name} />
                    <AvatarFallback>{getInitials(avatar.name)}</AvatarFallback>
                  </Avatar>
                  {selectedAvatar === avatar.url && (
                    <div className="absolute -right-1 -top-1 rounded-full bg-primary p-1 text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSelectAvatar} disabled={!selectedAvatar}>
              Select Avatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
