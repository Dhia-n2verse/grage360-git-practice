"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Bell, Clock, Check, AlertTriangle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getNotificationHistory, type NotificationRecord } from "@/lib/api/notifications"

interface NotificationHistoryProps {
  repairId: string
}

export function NotificationHistory({ repairId }: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await getNotificationHistory(repairId)
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notification history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [repairId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Sent
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch (error) {
      return dateString
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Notification History</CardTitle>
          <CardDescription>Previous notifications sent to customer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between items-start border-b pb-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-60" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Notification History</CardTitle>
            <CardDescription>Previous notifications sent to customer</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications have been sent yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                <div className="space-y-1">
                  <div className="font-medium">
                    {notification.notification_type === "progress" ? "Progress Update" : "Completion Notice"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(notification.sent_at)} via {notification.sent_via}
                  </div>
                  <div className="text-sm mt-1">{notification.message}</div>
                </div>
                <div>{getStatusBadge(notification.status)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
