"use client"

import { useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Camera } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface CameraCaptureProps {
  userId: string
  onCapture: (imageUrl: string) => void
}

export function CameraCapture({ userId, onCapture }: CameraCaptureProps) {
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Start camera when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      startCamera()
    } else {
      stopCamera()
    }
    setIsOpen(open)
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
      })
      setIsOpen(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsLoading(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) return

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8))

      if (!blob) {
        throw new Error("Failed to capture image")
      }

      // Create file from blob
      const file = new File([blob], `profile-${Date.now()}.jpg`, { type: "image/jpeg" })

      // Upload to Supabase
      const filePath = `${userId}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from("profileimage")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage.from("profileimage").getPublicUrl(filePath)

      // Return the URL
      onCapture(data.publicUrl)

      toast({
        title: "Photo Captured",
        description: "Your profile picture has been updated.",
      })

      setIsOpen(false)
    } catch (error) {
      console.error("Error capturing photo:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to capture and save photo. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => handleOpenChange(true)} className="flex items-center gap-2">
        <Camera className="h-4 w-4" />
        Take Photo
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take Profile Photo</DialogTitle>
            <DialogDescription>
              Position your face in the center of the frame and click the capture button.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-full overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="h-auto w-full" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={capturePhoto} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Capture Photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
