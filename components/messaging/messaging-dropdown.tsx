"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Inbox, Send, History } from "lucide-react"
import { useAuth } from "@/app/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { MessageList } from "@/components/messaging/message-list"
import { ComposeMessage } from "@/components/messaging/compose-message"
import { MessageView } from "@/components/messaging/message-view"
import { useToast } from "@/components/ui/use-toast"

export function MessagingDropdown() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("inbox")
  const [isComposing, setIsComposing] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch unread message count
  useEffect(() => {
    if (!user?.id) return

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", user.id)
          .eq("is_read", false)

        if (error) throw error
        setUnreadCount(count || 0)
      } catch (error) {
        console.error("Error fetching unread count:", error)
      }
    }

    fetchUnreadCount()

    // Subscribe to message changes
    const subscription = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  // Fetch messages based on active tab
  useEffect(() => {
    if (!user?.id || !isDialogOpen) return

    const fetchMessages = async () => {
      setLoading(true)
      try {
        let query = supabase.from("messages").select(`
          *,
          sender:sender_id(id, full_name, image, role),
          receiver:receiver_id(id, full_name, image, role)
        `)

        switch (activeTab) {
          case "inbox":
            // For inbox, show unread messages and read messages less than 3 days old
            const threeDaysAgo = new Date()
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

            query = query
              .eq("receiver_id", user.id)
              .or(`is_read.eq.false,and(is_read.eq.true,sent_at.gt.${threeDaysAgo.toISOString()})`)
            break
          case "sent":
            query = query.eq("sender_id", user.id)
            break
          case "history":
            query = query.or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
            break
        }

        const { data, error } = await query.order("sent_at", { ascending: false })

        if (error) throw error
        setMessages(data || [])
      } catch (error) {
        console.error(`Error fetching ${activeTab} messages:`, error)
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load ${activeTab} messages.`,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [user?.id, isDialogOpen, activeTab, toast])

  // Handle message selection
  const handleSelectMessage = async (message: any) => {
    setSelectedMessage(message)

    // Mark as read if it's an incoming message and not already read
    if (message.receiver_id === user?.id && !message.is_read) {
      try {
        const { error } = await supabase.from("messages").update({ is_read: true }).eq("id", message.id)

        if (error) throw error

        // Update the message in the local state
        setMessages(messages.map((m) => (m.id === message.id ? { ...m, is_read: true } : m)))

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        console.error("Error marking message as read:", error)
      }
    }
  }

  // Handle message send
  const handleMessageSent = () => {
    setIsComposing(false)
    if (activeTab !== "sent") {
      setActiveTab("sent")
    } else {
      // Refresh the sent messages
      const fetchSentMessages = async () => {
        setLoading(true)
        try {
          const { data, error } = await supabase
            .from("messages")
            .select(`
              *,
              sender:sender_id(id, full_name, image, role),
              receiver:receiver_id(id, full_name, image, role)
            `)
            .eq("sender_id", user?.id)
            .order("sent_at", { ascending: false })

          if (error) throw error
          setMessages(data || [])
        } catch (error) {
          console.error("Error fetching sent messages:", error)
        } finally {
          setLoading(false)
        }
      }
      fetchSentMessages()
    }
  }

  // Close message view
  const handleCloseMessageView = () => {
    setSelectedMessage(null)
  }

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative hidden sm:flex group transition-colors hover:bg-primary/10"
          >
            <div className="relative">
              <MessageSquare className="h-5 w-5 group-hover:text-primary transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 animate-pulse">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <Badge
                    variant="destructive"
                    className="absolute h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs border-2 border-background"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                </span>
              )}
            </div>
            <span className="sr-only">Messages</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onSelect={() => {
              setIsDialogOpen(true)
              setActiveTab("inbox")
              setIsDropdownOpen(false)
            }}
          >
            <Inbox className="mr-2 h-4 w-4" />
            <span>Inbox</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {unreadCount}
              </Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setIsDialogOpen(true)
              setActiveTab("sent")
              setIsDropdownOpen(false)
            }}
          >
            <Send className="mr-2 h-4 w-4" />
            <span>Sent</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setIsDialogOpen(true)
              setActiveTab("history")
              setIsDropdownOpen(false)
            }}
          >
            <History className="mr-2 h-4 w-4" />
            <span>Message History</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Messages</DialogTitle>
            <DialogDescription>View and manage your messages</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {isComposing ? (
              <ComposeMessage onCancel={() => setIsComposing(false)} onSent={handleMessageSent} />
            ) : selectedMessage ? (
              <MessageView message={selectedMessage} onClose={handleCloseMessageView} />
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="inbox" className="relative">
                      Inbox
                      {unreadCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="sent">Sent</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  <Button onClick={() => setIsComposing(true)}>Compose</Button>
                </div>

                <TabsContent value="inbox" className="mt-0">
                  <MessageList
                    messages={messages}
                    loading={loading}
                    emptyMessage="Your inbox is empty"
                    onSelectMessage={handleSelectMessage}
                  />
                </TabsContent>

                <TabsContent value="sent" className="mt-0">
                  <MessageList
                    messages={messages}
                    loading={loading}
                    emptyMessage="You haven't sent any messages"
                    onSelectMessage={handleSelectMessage}
                  />
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  <MessageList
                    messages={messages}
                    loading={loading}
                    emptyMessage="No message history found"
                    onSelectMessage={handleSelectMessage}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
