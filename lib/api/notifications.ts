import { supabase } from "@/lib/supabase"

interface NotificationData {
  customerId: string
  customerName: string
  customerPhone?: string
  vehicleInfo: string
  progress?: number
  status?: string
  repairId: string
}

export interface NotificationRecord {
  id?: string
  customer_id: string
  repair_id: string
  notification_type: "progress" | "completion"
  message: string
  sent_at: string
  sent_via: "whatsapp" | "email" | "sms"
  status: "sent" | "failed" | "pending"
  error_message?: string
}

/**
 * Formats a WhatsApp message based on notification type
 */
export function formatWhatsAppMessage(data: NotificationData): string {
  const { customerName, vehicleInfo, progress, status } = data
  const greeting = `Hello ${customerName}`

  if (status === "Completed") {
    return `${greeting}, your vehicle repair (${vehicleInfo}) has been completed. Thank you for choosing our service!`
  } else if (progress !== undefined) {
    return `${greeting}, your vehicle repair (${vehicleInfo}) is currently at ${progress}% completed.`
  }

  return `${greeting}, there's an update on your vehicle repair (${vehicleInfo}).`
}

/**
 * Creates a WhatsApp deep link with a prefilled message
 */
export function createWhatsAppLink(phone: string, message: string): string {
  // Format phone number (remove any non-digit characters)
  const formattedPhone = phone.replace(/\D/g, "")

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message)

  // Create the WhatsApp deep link
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

/**
 * Sends a notification via WhatsApp (using deep link approach)
 */
export async function sendWhatsAppNotification(
  data: NotificationData,
): Promise<{ success: boolean; link?: string; error?: string }> {
  try {
    if (!data.customerPhone) {
      return {
        success: false,
        error: "Customer phone number is missing",
      }
    }

    // Format the message
    const message = formatWhatsAppMessage(data)

    // Create WhatsApp deep link
    const whatsappLink = createWhatsAppLink(data.customerPhone, message)

    // Record the notification in the database
    const notificationRecord: NotificationRecord = {
      customer_id: data.customerId,
      repair_id: data.repairId,
      notification_type: data.status === "Completed" ? "completion" : "progress",
      message: message,
      sent_at: new Date().toISOString(),
      sent_via: "whatsapp",
      status: "pending", // Since we're using deep links, we can't confirm delivery
    }

    // Store notification in database
    const { error } = await supabase.from("notifications").insert(notificationRecord)

    if (error) {
      console.error("Error recording notification:", error)
      // Continue anyway since this is just for record-keeping
    }

    return {
      success: true,
      link: whatsappLink,
    }
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Checks if a notification should be sent based on repair progress and status
 */
export function shouldSendNotification(
  currentProgress: number,
  previousProgress: number,
  currentStatus: string,
  previousStatus: string,
  notificationsSent: { progress80: boolean; completion: boolean },
): { shouldSend: boolean; type: "progress" | "completion" | null } {
  // Check for completion notification
  if (currentStatus === "Completed" && previousStatus !== "Completed" && !notificationsSent.completion) {
    return { shouldSend: true, type: "completion" }
  }

  // Check for progress notification (when crossing 80% threshold)
  if (currentProgress >= 80 && previousProgress < 80 && !notificationsSent.progress80) {
    return { shouldSend: true, type: "progress" }
  }

  return { shouldSend: false, type: null }
}

/**
 * Gets notification history for a repair
 */
export async function getNotificationHistory(repairId: string): Promise<NotificationRecord[]> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("repair_id", repairId)
      .order("sent_at", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error fetching notification history:", error)
    return []
  }
}

/**
 * Checks if specific notifications have been sent for a repair
 */
export async function checkNotificationsSent(repairId: string): Promise<{ progress80: boolean; completion: boolean }> {
  try {
    const notifications = await getNotificationHistory(repairId)

    return {
      progress80: notifications.some((n) => n.notification_type === "progress"),
      completion: notifications.some((n) => n.notification_type === "completion"),
    }
  } catch (error) {
    console.error("Error checking notifications sent:", error)
    return { progress80: false, completion: false }
  }
}
