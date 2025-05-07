"use client"

import { useState } from "react"
import { ArrowLeft, Reply, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/app/context/auth-context"
import { getInitials } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { ComposeMessage } from "./compose-message"

interface MessageViewProps {
  message: any
  onClose: () => void
}

export function MessageView({ message, onClose }: MessageViewProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isReplying, setIsReplying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isReceived = message.receiver_id === user?.id
  const otherParty = isReceived ? message.sender : message.receiver

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Function to get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <Badge variant="destructive">Urgent</Badge>
      case "High":
        return <Badge variant="default">High</Badge>
      default:
        return <Badge variant="secondary">Normal</Badge>
    }
  }

  // Handle message deletion
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("messages").delete().eq("id", message.id)

      if (error) throw error

      toast({
        title: "Message deleted",
        description: "The message has been successfully deleted.",
      })
      onClose()
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete message. Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle reply sent
  const handleReplySent = () => {
    setIsReplying(false)
    onClose()
  }

  if (isReplying) {
    return <ComposeMessage onCancel={() => setIsReplying(false)} onSent={handleReplySent} replyTo={message} />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsReplying(true)}>
            <Reply className="mr-2 h-4 w-4" />
            Reply
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Message</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this message? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-md mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {message.sender?.image ? (
                <AvatarImage src={message.sender.image || "/placeholder.svg"} alt={message.sender.full_name} />
              ) : (
                <AvatarFallback>{getInitials(message.sender?.full_name || "?")}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-medium">{message.sender?.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {message.sender?.role} • {formatDate(message.sent_at)}
              </p>
            </div>
          </div>
          {getPriorityBadge(message.priority)}
        </div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm text-muted-foreground">To:</p>
          <p className="text-sm">{message.receiver?.full_name}</p>
        </div>
        <h3 className="text-lg font-medium mb-2">{message.subject}</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1 whitespace-pre-wrap">{message.content}</div>
      </ScrollArea>
    </div>
  )
}
