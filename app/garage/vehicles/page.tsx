"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VehicleRegistrationForm } from "@/components/vehicles/vehicle-registration-form"
import { VehicleList } from "@/components/vehicles/vehicle-list"
import { VehicleDetail } from "@/components/vehicles/vehicle-detail"
import { useAuth } from "@/app/context/auth-context"
import type { Vehicle } from "@/lib/api/vehicles"
import { Loader2, Plus, Download, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

// Update the fetchVehicles function to properly handle pagination and filtering
const fetchVehicles = async (page = 1, limit = 10, sortBy = "created_at", sortOrder = "desc", filter = "") => {
  try {
    // Calculate range for pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query with pagination and sorting
    let query = supabase
      .from("vehicles")
      .select(
        `
        *,
        customer:customer_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `,
        { count: "exact" },
      )
      .eq("status", "active")
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(from, to)

    // Apply filter if provided
    if (filter) {
      query = query.or(
        `make.ilike.%${filter}%,model.ilike.%${filter}%,license_plate.ilike.%${filter}%,vin.ilike.%${filter}%`,
      )
    }

    const { data, error, count } = await query

    if (error) throw error

    return { data: data || [], count: count || 0, error: null }
  } catch (err) {
    console.error("Error fetching vehicles:", err)
    return { data: [], count: 0, error: err }
  }
}

export default function VehiclesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("list") // Default to list view
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [lastRegisteredVehicle, setLastRegisteredVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filter, setFilter] = useState("")
  const [preselectedCustomerId, setPreselectedCustomerId] = useState<string | undefined>(undefined)

  // Check user permissions
  const canRead = user?.role === "Manager" || user?.role === "Front Desk" || user?.role === "Technician"
  const canWrite = user?.role === "Manager" || user?.role === "Front Desk"
  const canDisable = user?.role === "Manager"
  const canExportImport = user?.role === "Manager"

  useEffect(() => {
    if (!canRead) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to view this page.",
      })
      router.push("/dashboard")
      return
    }

    // Check if there's a customer_id in the URL query params
    const queryParams = new URLSearchParams(window.location.search)
    const customerId = queryParams.get("customer_id")
    if (customerId) {
      setPreselectedCustomerId(customerId)
      // If a customer ID is provided, switch to register tab
      setActiveTab("register")
    }

    fetchVehiclesData()

    // Set up real-time subscription for vehicle changes
    const subscription = supabase
      .channel("vehicles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vehicles",
        },
        () => {
          fetchVehiclesData()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, page, limit, sortBy, sortOrder, filter])

  const fetchVehiclesData = async () => {
    setIsLoading(true)
    try {
      const { data, count, error } = await fetchVehicles(page, limit, sortBy, sortOrder, filter)

      if (error) throw error

      setVehicles(data || [])
      setTotalCount(count || 0)

      // Set the last registered vehicle
      if (data && data.length > 0) {
        setLastRegisteredVehicle(data[0])
        if (!selectedVehicle) {
          setSelectedVehicle(data[0])
        }
      }
    } catch (err: any) {
      console.error("Error fetching vehicles:", err)
      setError(err.message || "Failed to load vehicles")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVehicleRegistered = (newVehicle: Vehicle) => {
    toast({
      title: "Registration Successful",
      description: `${newVehicle.make} ${newVehicle.model} has been registered successfully.`,
      duration: 4000,
    })

    // Refresh the vehicle list
    fetchVehiclesData()

    // Switch to the list view after registration
    setActiveTab("list")
  }

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setActiveTab("view")
  }

  const handleExportVehicles = () => {
    if (!canExportImport) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to export vehicle data.",
      })
      return
    }

    try {
      // Filter out sensitive data and prepare for export
      const exportData = vehicles.map((vehicle) => ({
        id: vehicle.id,
        customer_id: vehicle.customer_id,
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        model_year: vehicle.model_year,
        license_plate: vehicle.license_plate,
        vehicle_type: vehicle.vehicle_category,
        engine_type: vehicle.engine_type,
        fuel_type: vehicle.fuel_type,
        transmission_type: vehicle.transmission_type,
        mileage: vehicle.mileage,
        mileage_unit: vehicle.mileage_unit,
        created_at: vehicle.created_at,
      }))

      // Create a JSON blob and download it
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `vehicles-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `${exportData.length} vehicles exported successfully.`,
      })
    } catch (err: any) {
      console.error("Error exporting vehicles:", err)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err.message || "Failed to export vehicles. Please try again.",
      })
    }
  }

  const handleImportVehicles = () => {
    if (!canExportImport) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to import vehicle data.",
      })
      return
    }

    // Create a file input element
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "application/json"

    fileInput.onchange = async (e: any) => {
      try {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const vehiclesData = JSON.parse(event.target?.result as string)

            // Validate the data structure
            if (!Array.isArray(vehiclesData)) {
              throw new Error("Invalid import format. Expected an array of vehicles.")
            }

            // Process each vehicle
            let successCount = 0
            let errorCount = 0

            for (const vehicle of vehiclesData) {
              // Basic validation
              if (!vehicle.make || !vehicle.model || !vehicle.customer_id) {
                errorCount++
                continue
              }

              // Check if vehicle already exists (by VIN if available)
              let existingVehicle = null
              if (vehicle.vin) {
                const { data } = await supabase.from("vehicles").select("id").eq("vin", vehicle.vin).maybeSingle()
                existingVehicle = data
              }

              if (existingVehicle) {
                // Update existing vehicle
                const { error } = await supabase
                  .from("vehicles")
                  .update({
                    make: vehicle.make,
                    model: vehicle.model,
                    model_year: vehicle.model_year,
                    license_plate: vehicle.license_plate,
                    vehicle_type: vehicle.vehicle_type,
                    vehicle_category: vehicle.vehicle_category,
                    engine_type: vehicle.engine_type,
                    fuel_type: vehicle.fuel_type,
                    transmission_type: vehicle.transmission_type,
                    mileage: vehicle.mileage,
                    mileage_unit: vehicle.mileage_unit,
                  })
                  .eq("id", existingVehicle.id)

                if (error) {
                  errorCount++
                } else {
                  successCount++
                }
              } else {
                // Insert new vehicle
                const { error } = await supabase.from("vehicles").insert([
                  {
                    customer_id: vehicle.customer_id,
                    vin: vehicle.vin,
                    make: vehicle.make,
                    model: vehicle.model,
                    model_year: vehicle.model_year,
                    license_plate: vehicle.license_plate,
                    vehicle_type: vehicle.vehicle_type,
                    vehicle_category: vehicle.vehicle_category,
                    engine_type: vehicle.engine_type,
                    fuel_type: vehicle.fuel_type,
                    transmission_type: vehicle.transmission_type,
                    mileage: vehicle.mileage,
                    mileage_unit: vehicle.mileage_unit,
                  },
                ])

                if (error) {
                  errorCount++
                } else {
                  successCount++
                }
              }
            }

            // Refresh the vehicle list
            fetchVehiclesData()

            toast({
              title: "Import Complete",
              description: `Successfully processed ${successCount} vehicles. ${
                errorCount > 0 ? `Failed to process ${errorCount} vehicles.` : ""
              }`,
            })
          } catch (err: any) {
            console.error("Error parsing import file:", err)
            toast({
              variant: "destructive",
              title: "Import Failed",
              description: err.message || "Failed to parse import file. Please check the format and try again.",
            })
          }
        }
        reader.readAsText(file)
      } catch (err: any) {
        console.error("Error importing vehicles:", err)
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: err.message || "Failed to import vehicles. Please try again.",
        })
      }
    }

    fileInput.click()
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when changing limit
  }

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-")
    setSortBy(field)
    setSortOrder(order as "asc" | "desc")
    setPage(1) // Reset to first page when changing sort
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    setPage(1) // Reset to first page when changing filter
  }

  const totalPages = Math.ceil(totalCount / limit)

  if (!canRead) {
    return null // Prevent flash of content before redirect
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">Manage your vehicle database and registrations.</p>
        </div>
        <div className="flex items-center gap-2">
          {canExportImport && (
            <>
              <Button variant="outline" onClick={handleExportVehicles}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" onClick={handleImportVehicles}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </>
          )}
          {canWrite && (
            <Button onClick={() => setActiveTab("register")}>
              <Plus className="mr-2 h-4 w-4" />
              New Vehicle
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Vehicle List</TabsTrigger>
          {canWrite && <TabsTrigger value="register">Register Vehicle</TabsTrigger>}
          <TabsTrigger value="view">Vehicle Details</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="make-asc">Make (A-Z)</SelectItem>
                <SelectItem value="make-desc">Make (Z-A)</SelectItem>
                <SelectItem value="model-asc">Model (A-Z)</SelectItem>
                <SelectItem value="model-desc">Model (Z-A)</SelectItem>
                <SelectItem value="model_year-desc">Year (Newest)</SelectItem>
                <SelectItem value="model_year-asc">Year (Oldest)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <VehicleList
              vehicles={vehicles}
              onSelectVehicle={handleVehicleSelect}
              canRead={canRead}
              selectedVehicle={selectedVehicle}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              currentPage={page}
              totalPages={totalPages}
              itemsPerPage={limit}
            />
          )}
        </TabsContent>

        {canWrite && (
          <TabsContent value="register" className="space-y-4">
            <VehicleRegistrationForm
              onVehicleRegistered={handleVehicleRegistered}
              canWrite={canWrite}
              preselectedCustomerId={preselectedCustomerId}
            />
          </TabsContent>
        )}

        <TabsContent value="view" className="space-y-4">
          {selectedVehicle ? (
            <VehicleDetail
              vehicle={selectedVehicle}
              canWrite={canWrite}
              canDisable={canDisable}
              onVehicleUpdated={fetchVehiclesData}
            />
          ) : lastRegisteredVehicle ? (
            <VehicleDetail
              vehicle={lastRegisteredVehicle}
              canWrite={canWrite}
              canDisable={canDisable}
              onVehicleUpdated={fetchVehiclesData}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-muted-foreground mb-4">No vehicle selected</p>
              <Button onClick={() => setActiveTab("list")}>View Vehicle List</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
