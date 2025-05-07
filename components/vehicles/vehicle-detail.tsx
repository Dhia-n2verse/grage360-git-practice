"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Pencil,
  Trash2,
  Car,
  Truck,
  BikeIcon as Motorcycle,
  AlertTriangle,
  Loader2,
  Calendar,
  Tag,
  Gauge,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { deactivateVehicle, type Vehicle } from "@/lib/api/vehicles"
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
import { useRouter } from "next/navigation"

interface VehicleDetailProps {
  vehicle: Vehicle
  canWrite: boolean
  canDisable: boolean
  onVehicleUpdated: () => void
}

export function VehicleDetail({ vehicle, canWrite, canDisable, onVehicleUpdated }: VehicleDetailProps) {
  const { toast } = useToast()
  const [isDisabling, setIsDisabling] = useState(false)
  const router = useRouter()

  // Helper function to get vehicle category icon
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "SUV":
      case "Sedan":
        return <Car className="mr-1 h-4 w-4" />
      case "Truck":
      case "Van":
        return <Truck className="mr-1 h-4 w-4" />
      case "Motorcycle":
        return <Motorcycle className="mr-1 h-4 w-4" />
      default:
        return <Car className="mr-1 h-4 w-4" />
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

  // Handle vehicle disable
  const handleDisableVehicle = async () => {
    if (!canDisable) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to disable vehicles.",
      })
      return
    }

    setIsDisabling(true)
    try {
      const { success, error } = await deactivateVehicle(vehicle.id!)

      if (error) throw error

      toast({
        title: "Vehicle Disabled",
        description: "The vehicle has been successfully disabled.",
      })

      onVehicleUpdated()
    } catch (err: any) {
      console.error("Error disabling vehicle:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to disable vehicle. Please try again.",
      })
    } finally {
      setIsDisabling(false)
    }
  }

  // Handle edit vehicle
  const handleEditVehicle = () => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to edit vehicles.",
      })
      return
    }

    // Navigate to edit form with vehicle ID
    router.push(`/garage/vehicles/edit/${vehicle.id}`)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vehicle Details</CardTitle>
            <CardDescription>View detailed information about this vehicle.</CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto flex items-center">
            {getCategoryIcon(vehicle.vehicle_category)}
            {vehicle.vehicle_category || "Unknown"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center mb-6">
            <div className="h-32 w-32 mb-4 flex items-center justify-center bg-muted rounded-md">
              {vehicle.logo_image ? (
                <img
                  src={vehicle.logo_image || "/placeholder.svg"}
                  alt={`${vehicle.make} logo`}
                  className="h-24 w-24 object-contain"
                />
              ) : (
                <div className="h-16 w-16 text-muted-foreground">{getCategoryIcon(vehicle.vehicle_category)}</div>
              )}
            </div>
            <h2 className="text-2xl font-bold">
              {vehicle.make} {vehicle.model}
            </h2>
            <div className="text-muted-foreground">
              {vehicle.model_year ? `${vehicle.model_year} • ` : ""}
              {vehicle.license_plate}
            </div>
            <Badge variant="outline" className="mt-2 flex items-center gap-1">
              {getCategoryIcon(vehicle.vehicle_category)}
              <span>{vehicle.vehicle_category || "Unknown"}</span>
            </Badge>
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Vehicle Information</h4>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="font-medium w-24">VIN:</span>
                    <span>{vehicle.vin || "Not provided"}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-24">Type:</span>
                    <span>{vehicle.vehicle_type || "Not specified"}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-24">Category:</span>
                    <span>{vehicle.vehicle_category || "Not specified"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Owner Information</h4>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="font-medium w-24">Name:</span>
                    <span>
                      {vehicle.customer?.first_name} {vehicle.customer?.last_name}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-24">Email:</span>
                    <span>{vehicle.customer?.email}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-24">Phone:</span>
                    <span>{vehicle.customer?.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Engine & Fuel</h4>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="font-medium w-24">Engine:</span>
                    <span>{vehicle.engine_type || "Not specified"}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-24">Fuel:</span>
                    <span>{vehicle.fuel_type || "Not specified"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Transmission</h4>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="font-medium w-24">Type:</span>
                    <span>{vehicle.transmission_type || "Not specified"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Mileage</h4>
                <div className="space-y-2">
                  {vehicle.mileage ? (
                    <div className="flex items-start">
                      <span className="font-medium w-24">Current:</span>
                      <span>
                        {vehicle.mileage.toLocaleString()} {vehicle.mileage_unit}
                      </span>
                    </div>
                  ) : (
                    <span>Not provided</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Registration</p>
              <p className="text-xs text-muted-foreground">{vehicle.license_plate || "Not provided"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Last Service</p>
              <p className="text-xs text-muted-foreground">{formatDate(vehicle.last_appointment_date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Added On</p>
              <p className="text-xs text-muted-foreground">{formatDate(vehicle.created_at)}</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Vehicle ID: {vehicle.id}</p>
          <p>Last Updated: {formatDate(vehicle.updated_at)}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {canWrite && (
          <Button variant="outline" onClick={handleEditVehicle}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Vehicle
          </Button>
        )}
        {canDisable && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Disable Vehicle
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disable Vehicle</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to disable this vehicle? This action can be reversed by an administrator.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 dark:bg-amber-900 dark:text-amber-200 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">
                    Disabling this vehicle will hide it from active views but not delete its data.
                  </p>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisableVehicle} disabled={isDisabling}>
                  {isDisabling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    "Disable Vehicle"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  )
}
