"use client"

import { useState } from "react"
import { Bell, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { sendWhatsAppNotification } from "@/lib/api/notifications"
import { useToast } from "@/components/ui/use-toast"

interface NotificationButtonProps {
  customerId: string
  customerName: string
  customerPhone?: string
  vehicleInfo: string
  progress?: number
  status?: string
  repairId: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function NotificationButton({
  customerId,
  customerName,
  customerPhone,
  vehicleInfo,
  progress,
  status,
  repairId,
  variant = "outline",
  size = "default",
  className,
}: NotificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<"success" | "error" | null>(null)
  const { toast } = useToast()

  const handleNotify = async () => {
    if (!customerPhone) {
      toast({
        variant: "destructive",
        title: "Missing phone number",
        description: "Customer phone number is required to send a notification.",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await sendWhatsAppNotification({
        customerId,
        customerName,
        customerPhone,
        vehicleInfo,
        progress,
        status,
        repairId,
      })

      if (response.success && response.link) {
        setResult("success")
        // Open WhatsApp in a new tab
        window.open(response.link, "_blank")

        toast({
          title: "WhatsApp opened",
          description: "WhatsApp has been opened with a pre-filled message.",
        })
      } else {
        throw new Error(response.error || "Failed to create WhatsApp link")
      }
    } catch (error) {
      console.error("Error sending notification:", error)
      setResult("error")

      toast({
        variant: "destructive",
        title: "Notification failed",
        description: error instanceof Error ? error.message : "Failed to send notification",
      })
    } finally {
      setIsLoading(false)

      // Reset result status after 3 seconds
      setTimeout(() => {
        setResult(null)
      }, 3000)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleNotify}
            disabled={isLoading || !customerPhone}
            className={className}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : result === "success" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : result === "error" ? (
              <X className="h-4 w-4 text-red-500" />
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Notify Customer
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {!customerPhone ? "Customer phone number is missing" : "Send a WhatsApp notification to the customer"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
