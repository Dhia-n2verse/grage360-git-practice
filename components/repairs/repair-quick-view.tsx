"use client"

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Car, CheckCircle, Clock, Pencil, Settings, User, UserCog, Wrench, XCircle } from "lucide-react"
import type { Repair } from "@/lib/api/repairs"

// Import the notification button
import { NotificationButton } from "@/components/repairs/notification-button"

interface RepairQuickViewProps {
  repair: Repair
  onViewFull: () => void
  onEdit: () => void
}

export function RepairQuickView({ repair, onViewFull, onEdit }: RepairQuickViewProps) {
  const formatCurrency = (value?: number) => {
    if (value === undefined) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null

    switch (status) {
      case "Completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        )
      case "InProgress":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            In Progress
          </Badge>
        )
      case "Scheduled":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Scheduled
          </Badge>
        )
      case "Pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "Cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not available"
    try {
      return format(new Date(dateString), "PPP")
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {repair.vehicle?.make} {repair.vehicle?.model}
        </h3>
        {getStatusBadge(repair.status)}
      </div>

      <div className="text-sm text-muted-foreground">Created on {formatDate(repair.created_at)}</div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Vehicle</span>
        </div>
        <div className="pl-6 text-sm">
          <div>
            {repair.vehicle?.make} {repair.vehicle?.model} {repair.vehicle?.model_year}
          </div>
          <div className="text-muted-foreground">{repair.vehicle?.license_plate}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Customer</span>
        </div>
        <div className="pl-6 text-sm">
          <div>
            {repair.customer?.first_name} {repair.customer?.last_name}
          </div>
          <div className="text-muted-foreground">{repair.customer?.phone}</div>
        </div>
      </div>

      {/* Add Technician Information */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <UserCog className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Technician</span>
        </div>
        <div className="pl-6 text-sm">
          {repair.technician_specialty ? (
            <>
              <div>{repair.technician_specialty.technician?.full_name || "Unassigned"}</div>
              <div className="text-muted-foreground">{repair.technician_specialty.specialty?.name || "N/A"}</div>
            </>
          ) : (
            <div className="text-muted-foreground italic">No technician assigned</div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm">{repair.progress}%</span>
        </div>
        <Progress value={repair.progress} className="h-2" />
      </div>

      <div className="space-y-1">
        <span className="text-sm font-medium">Description</span>
        <p className="text-sm">{repair.description || "No description provided"}</p>
      </div>

      <div className="space-y-1">
        <span className="text-sm font-medium">Total Cost</span>
        <p className="text-lg font-bold">{formatCurrency(repair.total_cost)}</p>
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 h-3 w-3" />
          Edit
        </Button>
        <div className="flex gap-2">
          {repair.notify_customer && repair.customer?.phone && (
            <NotificationButton
              customerId={repair.customer_id}
              customerName={`${repair.customer?.first_name || ""} ${repair.customer?.last_name || ""}`}
              customerPhone={repair.customer?.phone}
              vehicleInfo={`${repair.vehicle?.make || ""} ${repair.vehicle?.model || ""}`}
              progress={repair.progress}
              status={repair.status}
              repairId={repair.id!}
              size="sm"
              variant="outline"
            />
          )}
          <Button size="sm" onClick={onViewFull}>
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}
