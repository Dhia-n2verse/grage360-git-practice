"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Pencil,
  Settings,
  Wrench,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Car,
  User,
  Stethoscope,
  ShoppingBag,
  UserCog,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { getRepairById, updateRepair, type Repair } from "@/lib/api/repairs"
import { useAuth } from "@/app/context/auth-context"
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
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

// Import the notification components
import { NotificationButton } from "@/components/repairs/notification-button"
import { NotificationHistory } from "@/components/repairs/notification-history"
import { checkNotificationsSent, shouldSendNotification } from "@/lib/api/notifications"

interface RepairDetailProps {
  id: string
}

export function RepairDetail({ id }: RepairDetailProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [repair, setRepair] = useState<Repair | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)

  // Add state for tracking notification status
  const [notificationsSent, setNotificationsSent] = useState<{ progress80: boolean; completion: boolean }>({
    progress80: false,
    completion: false,
  })
  const [previousProgress, setPreviousProgress] = useState<number>(0)
  const [previousStatus, setPreviousStatus] = useState<string>("")

  const canWrite = user?.role === "Manager" || user?.role === "Front Desk"
  const canUpdateProgress = user?.role === "Technician" || user?.role === "Manager"

  useEffect(() => {
    fetchRepair()

    // Check if notifications have been sent for this repair
    const checkNotifications = async () => {
      if (id) {
        const notificationStatus = await checkNotificationsSent(id)
        setNotificationsSent(notificationStatus)
      }
    }

    checkNotifications()
  }, [id])

  // Modify the fetchRepair function to track previous values
  const fetchRepair = async () => {
    setLoading(true)
    try {
      const data = await getRepairById(id)

      // Store previous values before updating
      if (repair) {
        setPreviousProgress(repair.progress)
        setPreviousStatus(repair.status)
      }

      setRepair(data)

      // Check if we should send a notification based on progress/status changes
      if (repair && data) {
        const { shouldSend, type } = shouldSendNotification(
          data.progress,
          repair.progress,
          data.status,
          repair.status,
          notificationsSent,
        )

        if (shouldSend && type && data.customer?.phone) {
          // Update notification status locally to prevent duplicate notifications
          setNotificationsSent((prev) => ({
            ...prev,
            [type === "progress" ? "progress80" : "completion"]: true,
          }))

          // Show toast notification to user that customer can be notified
          toast({
            title: `${type === "progress" ? "Progress Update" : "Repair Completed"}`,
            description: "Customer can be notified of this update.",
            action: (
              <NotificationButton
                customerId={data.customer_id}
                customerName={`${data.customer.first_name} ${data.customer.last_name}`}
                customerPhone={data.customer.phone}
                vehicleInfo={`${data.vehicle?.make} ${data.vehicle?.model}`}
                progress={data.progress}
                status={data.status}
                repairId={id}
                variant="outline"
                size="sm"
              />
            ),
          })
        }
      }
    } catch (error) {
      console.error("Error fetching repair:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load repair details",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (status: "Scheduled" | "InProgress" | "Pending" | "Completed" | "Cancelled") => {
    if (!canWrite && status !== "InProgress") {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to update repair status.",
      })
      return
    }

    setIsUpdatingStatus(true)
    try {
      const updates: Partial<Repair> = { status }

      // If status is Completed, set progress to 100%
      if (status === "Completed") {
        updates.progress = 100
      }

      const { success, error } = await updateRepair(id, updates)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: `The repair status has been updated to ${status}.`,
      })

      // Refresh repair data
      fetchRepair()
    } catch (err: any) {
      console.error("Error updating repair status:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update repair status. Please try again.",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleProgressUpdate = async (progress: number) => {
    if (!canUpdateProgress) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to update repair progress.",
      })
      return
    }

    if (repair?.status === "Pending") {
      toast({
        variant: "destructive",
        title: "Cannot Update Progress",
        description: "Cannot update progress while repair is in Pending status.",
      })
      return
    }

    setIsUpdatingProgress(true)
    try {
      const { success, error } = await updateRepair(id, { progress })

      if (error) throw error

      toast({
        title: "Progress Updated",
        description: `The repair progress has been updated to ${progress}%.`,
      })

      // Refresh repair data
      fetchRepair()
    } catch (err: any) {
      console.error("Error updating repair progress:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update repair progress. Please try again.",
      })
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  const handleEditRepair = () => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to edit repairs.",
      })
      return
    }

    router.push(`/garage/repairs/edit/${id}`)
  }

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Separator />
            <Skeleton className="h-20 w-full" />
            <Separator />
            <Skeleton className="h-40 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!repair) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Repair Not Found</h2>
        <p className="text-muted-foreground mb-4">The repair you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/garage/repairs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Repairs
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.push("/garage/repairs")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Repair Details</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {repair.vehicle?.make} {repair.vehicle?.model} Repair
              </CardTitle>
              <CardDescription>
                {repair.vehicle?.license_plate} • Created on {formatDate(repair.created_at)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Status:</div>
              {getStatusBadge(repair.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Vehicle Information</h3>
              </div>
              <div className="space-y-2 pl-7">
                <div className="flex items-start">
                  <span className="font-medium w-24">Make/Model:</span>
                  <span>
                    {repair.vehicle?.make} {repair.vehicle?.model}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Year:</span>
                  <span>{repair.vehicle?.model_year || "N/A"}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">License:</span>
                  <span>{repair.vehicle?.license_plate || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Customer Information</h3>
              </div>
              <div className="space-y-2 pl-7">
                <div className="flex items-start">
                  <span className="font-medium w-24">Name:</span>
                  <span>
                    {repair.customer?.first_name} {repair.customer?.last_name}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Email:</span>
                  <span>{repair.customer?.email}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Phone:</span>
                  <span>{repair.customer?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Add Technician Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Technician Information</h3>
            </div>
            <div className="space-y-2 pl-7">
              {repair.technician_specialty ? (
                <>
                  <div className="flex items-start">
                    <span className="font-medium w-24">Name:</span>
                    <span>{repair.technician_specialty.technician?.full_name || "Unassigned"}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-24">Specialty:</span>
                    <span>{repair.technician_specialty.specialty?.name || "N/A"}</span>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground italic">No technician assigned to this repair</div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Repair Progress</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{repair.progress}% Complete</span>
                {repair.status === "InProgress" && canUpdateProgress && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProgressUpdate(Math.max(0, repair.progress - 10))}
                      disabled={isUpdatingProgress || repair.progress <= 0}
                    >
                      -10%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProgressUpdate(Math.min(100, repair.progress + 10))}
                      disabled={isUpdatingProgress || repair.progress >= 100}
                    >
                      +10%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProgressUpdate(100)}
                      disabled={isUpdatingProgress || repair.progress === 100}
                    >
                      Complete
                    </Button>
                  </div>
                )}
              </div>
              <Progress value={repair.progress} className="h-2" />
            </div>
          </div>

          {repair.diagnostic && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Related Diagnostic</h3>
                </div>
                <div className="space-y-2 pl-7">
                  {repair.diagnostic.observation && (
                    <div className="space-y-1">
                      <span className="font-medium">Observation:</span>
                      <p className="text-sm">{repair.diagnostic.observation}</p>
                    </div>
                  )}
                  {repair.diagnostic.recommendation && (
                    <div className="space-y-1">
                      <span className="font-medium">Recommendation:</span>
                      <p className="text-sm">{repair.diagnostic.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Repair Details</h3>
            </div>
            <div className="space-y-4 pl-7">
              <div className="space-y-1">
                <span className="font-medium">Description:</span>
                <p className="text-sm">{repair.description || "No description provided"}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium">Notes:</span>
                <p className="text-sm">{repair.notes || "No notes provided"}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Parts & Costs</h3>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repair.repair_items && repair.repair_items.length > 0 ? (
                    repair.repair_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.stock_item?.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No parts added to this repair
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="font-medium">
                      Labor Cost
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(repair.labor_cost)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">
                      Total Cost
                    </TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(repair.total_cost)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {canWrite && (
              <Button variant="outline" onClick={handleEditRepair}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {repair.notify_customer && (
              <NotificationButton
                customerId={repair.customer_id}
                customerName={`${repair.customer?.first_name || ""} ${repair.customer?.last_name || ""}`}
                customerPhone={repair.customer?.phone}
                vehicleInfo={`${repair.vehicle?.make || ""} ${repair.vehicle?.model || ""}`}
                progress={repair.progress}
                status={repair.status}
                repairId={id}
              />
            )}
          </div>

          <div className="flex gap-2">
            {repair.status !== "Cancelled" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Repair
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Repair</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this repair? This action can be reversed by updating the status.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, Keep Repair</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleStatusUpdate("Cancelled")}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Yes, Cancel Repair
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {repair.status !== "Completed" && (
              <div className="flex gap-2">
                {repair.status !== "Pending" && (
                  <Button variant="outline" onClick={() => handleStatusUpdate("Pending")} disabled={isUpdatingStatus}>
                    {isUpdatingStatus ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Settings className="mr-2 h-4 w-4" />
                    )}
                    Set Pending
                  </Button>
                )}

                {repair.status !== "InProgress" && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate("InProgress")}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wrench className="mr-2 h-4 w-4" />
                    )}
                    Start Work
                  </Button>
                )}

                {repair.status !== "Completed" && (
                  <Button onClick={() => handleStatusUpdate("Completed")} disabled={isUpdatingStatus}>
                    {isUpdatingStatus ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Complete
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardFooter>
        <Separator />
        <CardContent className="pt-6">
          <NotificationHistory repairId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
