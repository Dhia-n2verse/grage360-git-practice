"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface FileUploadProps {
  userId: string
  onUpload: (imageUrl: string) => void
}

export function FileUpload({ userId, onUpload }: FileUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    setIsLoading(true)

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file")
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File size must be less than 2MB")
      }

      // Upload to Supabase
      const filePath = `${userId}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from("profileimage")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage.from("profileimage").getPublicUrl(filePath)

      // Return the URL
      onUpload(data.publicUrl)

      toast({
        title: "Image Uploaded",
        description: "Your profile picture has been updated.",
      })
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
      })
    } finally {
      setIsLoading(false)
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handleClick} disabled={isLoading} className="flex items-center gap-2">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Upload Image
      </Button>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </>
  )
}
