"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getInitials } from "@/lib/utils"
import { DefaultAvatarSelector } from "./avatar-selector"
import { CameraCapture } from "./camera-capture"
import { FileUpload } from "./file-upload"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/auth-context"

interface ProfileImageManagerProps {
  userId: string
  userName: string
  currentImage: string | null
  onImageChange: (imageUrl: string | null) => void
}

export function ProfileImageManager({ userId, userName, currentImage, onImageChange }: ProfileImageManagerProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("upload")
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage)
  const { updateUserImage } = useAuth()

  const handleImageSelect = (imageUrl: string) => {
    setPreviewImage(imageUrl)
    onImageChange(imageUrl)
    // Optionally update the user context immediately for real-time UI updates
    // updateUserImage(imageUrl);
  }

  const handleRemoveImage = async () => {
    // If the image is from profileimage bucket, try to delete it
    if (previewImage && previewImage.includes("/profileimage/")) {
      try {
        // Extract the path from the URL
        const url = new URL(previewImage)
        const pathParts = url.pathname.split("/")
        const bucketIndex = pathParts.findIndex((part) => part === "profileimage")

        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(bucketIndex + 1).join("/")

          // Delete the file from storage
          const { error } = await supabase.storage.from("profileimage").remove([filePath])

          if (error) {
            console.error("Error deleting image:", error)
          }
        }
      } catch (error) {
        console.error("Error parsing image URL:", error)
      }
    }

    // Update state and notify parent
    setPreviewImage(null)
    onImageChange(null)
    // Optionally update the user context immediately for real-time UI updates
    // updateUserImage(null);

    toast({
      title: "Image Removed",
      description: "Your profile picture has been removed.",
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center gap-6 mb-6">
          <Avatar className="h-32 w-32 border-2 border-muted">
            {previewImage ? (
              <AvatarImage src={previewImage || "/placeholder.svg"} alt={userName} />
            ) : (
              <AvatarFallback>{getInitials(userName)}</AvatarFallback>
            )}
          </Avatar>

          {previewImage && (
            <Button variant="destructive" onClick={handleRemoveImage}>
              Remove Photo
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="camera">Camera</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="flex justify-center py-4">
            <FileUpload userId={userId} onUpload={handleImageSelect} />
          </TabsContent>

          <TabsContent value="camera" className="flex justify-center py-4">
            <CameraCapture userId={userId} onCapture={handleImageSelect} />
          </TabsContent>

          <TabsContent value="gallery" className="flex justify-center py-4">
            <DefaultAvatarSelector currentImage={previewImage} userName={userName} onSelect={handleImageSelect} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
