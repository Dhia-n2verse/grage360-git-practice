"use client"
import { Loader2, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/context/auth-context"
import { getInitials } from "@/lib/utils"

interface MessageListProps {
  messages: any[]
  loading: boolean
  emptyMessage: string
  onSelectMessage: (message: any) => void
}

export function MessageList({ messages, loading, emptyMessage, onSelectMessage }: MessageListProps) {
  const { user } = useAuth()

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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays < 7) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      return days[date.getDay()]
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-2" />
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-2">
        {messages.map((message) => {
          const isReceived = message.receiver_id === user?.id
          const otherParty = isReceived ? message.sender : message.receiver

          return (
            <div
              key={message.id}
              className={`p-3 rounded-md cursor-pointer transition-colors ${
                message.is_read ? "bg-background hover:bg-muted/50" : "bg-muted hover:bg-muted/80 font-medium"
              }`}
              onClick={() => onSelectMessage(message)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {otherParty?.image ? (
                    <AvatarImage src={otherParty.image || "/placeholder.svg"} alt={otherParty.full_name} />
                  ) : (
                    <AvatarFallback>{getInitials(otherParty?.full_name || "?")}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{otherParty?.full_name}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(message.sent_at)}</span>
                  </div>
                  <p className="text-sm truncate">{message.subject}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {message.content.substring(0, 60)}
                      {message.content.length > 60 ? "..." : ""}
                    </p>
                    {getPriorityBadge(message.priority)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
