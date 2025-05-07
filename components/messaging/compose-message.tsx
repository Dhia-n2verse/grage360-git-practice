"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/app/context/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface ComposeMessageProps {
  onCancel: () => void
  onSent: () => void
  replyTo?: any
}

export function ComposeMessage({ onCancel, onSent, replyTo }: ComposeMessageProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [recipients, setRecipients] = useState<any[]>([])
  const [formData, setFormData] = useState({
    receiverId: replyTo ? replyTo.sender_id : "",
    subject: replyTo ? `Re: ${replyTo.subject}` : "",
    content: replyTo
      ? `\n\n---\nOn ${new Date(replyTo.sent_at).toLocaleString()}, ${replyTo.sender.full_name} wrote:\n\n${replyTo.content}`
      : "",
    priority: "Normal" as "Normal" | "High" | "Urgent",
  })

  // Fetch potential recipients (all users except current user)
  useEffect(() => {
    const fetchRecipients = async () => {
      setLoadingRecipients(true)
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .neq("id", user?.id)
          .in("role", ["Manager", "Front Desk", "Technician"])
          .order("role")
          .order("full_name")

        if (error) throw error
        setRecipients(data || [])
      } catch (error) {
        console.error("Error fetching recipients:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load recipients. Please try again.",
        })
      } finally {
        setLoadingRecipients(false)
      }
    }

    fetchRecipients()
  }, [user?.id, toast])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle priority selection
  const handlePriorityChange = (value: "Normal" | "High" | "Urgent") => {
    setFormData((prev) => ({ ...prev, priority: value }))
  }

  // Handle recipient selection
  const handleRecipientChange = (value: string) => {
    setFormData((prev) => ({ ...prev, receiverId: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.receiverId || !formData.subject.trim() || !formData.content.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields.",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user?.id,
        receiver_id: formData.receiverId,
        subject: formData.subject,
        content: formData.content,
        priority: formData.priority,
        is_read: false,
        sent_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      })
      onSent()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            "Sending..."
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="receiver">To</Label>
          <Select
            value={formData.receiverId}
            onValueChange={handleRecipientChange}
            disabled={loadingRecipients || loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((recipient) => (
                <SelectItem key={recipient.id} value={recipient.id}>
                  {recipient.full_name} ({recipient.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Message subject"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={handlePriorityChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Message</Label>
          <Textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Type your message here..."
            rows={10}
            disabled={loading}
          />
        </div>
      </div>
    </form>
  )
}
