"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  Car,
  Truck,
  BikeIcon as Motorcycle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import type { Vehicle } from "@/lib/api/vehicles"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface VehicleListProps {
  vehicles: Vehicle[]
  onSelectVehicle: (vehicle: Vehicle) => void
  canRead: boolean
  selectedVehicle: Vehicle | null
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  currentPage?: number
  totalPages?: number
  itemsPerPage?: number
}

export function VehicleList({
  vehicles,
  onSelectVehicle,
  canRead,
  selectedVehicle,
  onPageChange,
  onLimitChange,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 10,
}: VehicleListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [makeFilter, setMakeFilter] = useState("")
  const [modelFilter, setModelFilter] = useState("")
  const [plateFilter, setPlateFilter] = useState("")
  const [ownerFilter, setOwnerFilter] = useState("")
  const [sortField, setSortField] = useState<string>("make")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  if (!canRead) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to view vehicles.</p>
      </div>
    )
  }

  // Filter vehicles based on all filters
  const filteredVehicles = vehicles.filter((vehicle) => {
    // Skip disabled vehicles
    if (vehicle.status === "disabled") return false

    const makeModel = `${vehicle.make} ${vehicle.model}`.toLowerCase()
    const licensePlate = vehicle.license_plate?.toLowerCase() || ""
    const vin = vehicle.vin?.toLowerCase() || ""
    const ownerName = `${vehicle.customer?.first_name || ""} ${vehicle.customer?.last_name || ""}`.toLowerCase()
    const ownerEmail = vehicle.customer?.email?.toLowerCase() || ""

    // Apply all filters
    const matchesSearch =
      searchQuery === "" ||
      makeModel.includes(searchQuery.toLowerCase()) ||
      licensePlate.includes(searchQuery.toLowerCase()) ||
      vin.includes(searchQuery.toLowerCase()) ||
      ownerName.includes(searchQuery.toLowerCase()) ||
      ownerEmail.includes(searchQuery.toLowerCase())

    const matchesCategory = filterCategory === null || vehicle.vehicle_category === filterCategory

    const matchesMakeFilter = makeFilter === "" || vehicle.make.toLowerCase().includes(makeFilter.toLowerCase())
    const matchesModelFilter = modelFilter === "" || vehicle.model.toLowerCase().includes(modelFilter.toLowerCase())
    const matchesPlateFilter = plateFilter === "" || licensePlate.includes(plateFilter.toLowerCase())
    const matchesOwnerFilter = ownerFilter === "" || ownerName.includes(ownerFilter.toLowerCase())

    return (
      matchesSearch &&
      matchesCategory &&
      matchesMakeFilter &&
      matchesModelFilter &&
      matchesPlateFilter &&
      matchesOwnerFilter
    )
  })

  // Sort vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    let valueA, valueB

    switch (sortField) {
      case "make":
        valueA = a.make.toLowerCase()
        valueB = b.make.toLowerCase()
        break
      case "model":
        valueA = a.model.toLowerCase()
        valueB = b.model.toLowerCase()
        break
      case "license_plate":
        valueA = a.license_plate?.toLowerCase() || ""
        valueB = b.license_plate?.toLowerCase() || ""
        break
      case "owner_name":
        valueA = `${a.customer?.first_name || ""} ${a.customer?.last_name || ""}`.toLowerCase()
        valueB = `${b.customer?.first_name || ""} ${b.customer?.last_name || ""}`.toLowerCase()
        break
      case "owner_contact":
        valueA = a.customer?.phone || a.customer?.email || ""
        valueB = b.customer?.phone || b.customer?.email || ""
        break
      default:
        valueA = a.make.toLowerCase()
        valueB = b.make.toLowerCase()
    }

    if (sortDirection === "asc") {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
    }
  })

  // Helper function to get vehicle category icon
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "SUV":
      case "Sedan":
        return <Car className="h-4 w-4" />
      case "Truck":
      case "Van":
        return <Truck className="h-4 w-4" />
      case "Motorcycle":
        return <Motorcycle className="h-4 w-4" />
      default:
        return <Car className="h-4 w-4" />
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

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search vehicles..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Column Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel>Filter by Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <label className="text-xs font-medium mb-1 block">Make</label>
                <Input
                  placeholder="Filter by make"
                  value={makeFilter}
                  onChange={(e) => setMakeFilter(e.target.value)}
                  className="mb-2"
                />

                <label className="text-xs font-medium mb-1 block">Model</label>
                <Input
                  placeholder="Filter by model"
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                  className="mb-2"
                />

                <label className="text-xs font-medium mb-1 block">License Plate</label>
                <Input
                  placeholder="Filter by license plate"
                  value={plateFilter}
                  onChange={(e) => setPlateFilter(e.target.value)}
                  className="mb-2"
                />

                <label className="text-xs font-medium mb-1 block">Owner</label>
                <Input
                  placeholder="Filter by owner name"
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="mb-2"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Filter className="mr-2 h-4 w-4" />
                Category
                {filterCategory && (
                  <Badge variant="secondary" className="ml-2">
                    {filterCategory}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterCategory(null)}>All Categories</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory("SUV")}>
                <Car className="mr-2 h-4 w-4" />
                SUV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory("Sedan")}>
                <Car className="mr-2 h-4 w-4" />
                Sedan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory("Truck")}>
                <Truck className="mr-2 h-4 w-4" />
                Truck
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory("Van")}>
                <Truck className="mr-2 h-4 w-4" />
                Van
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory("Motorcycle")}>
                <Motorcycle className="mr-2 h-4 w-4" />
                Motorcycle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory("Other")}>
                <Car className="mr-2 h-4 w-4" />
                Other
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {sortedVehicles.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No vehicles found</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Vehicle List - Left Column */}
          <div className="col-span-1 lg:col-span-2">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSortChange("make")}>
                      <div className="flex items-center">Make {getSortIcon("make")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSortChange("model")}>
                      <div className="flex items-center">Model {getSortIcon("model")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSortChange("license_plate")}>
                      <div className="flex items-center">License Plate {getSortIcon("license_plate")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSortChange("owner_name")}>
                      <div className="flex items-center">Owner Name {getSortIcon("owner_name")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSortChange("owner_contact")}>
                      <div className="flex items-center">Owner Contact {getSortIcon("owner_contact")}</div>
                    </TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVehicles.map((vehicle) => (
                    <TableRow
                      key={vehicle.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedVehicle?.id === vehicle.id ? "bg-muted/50" : ""}`}
                      onClick={() => onSelectVehicle(vehicle)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {vehicle.logo_image ? (
                            <img
                              src={vehicle.logo_image || "/placeholder.svg"}
                              alt={`${vehicle.make} logo`}
                              className="h-6 w-6 object-contain"
                            />
                          ) : (
                            getCategoryIcon(vehicle.vehicle_category)
                          )}
                          {vehicle.make}
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.license_plate}</TableCell>
                      <TableCell>
                        {vehicle.customer?.first_name} {vehicle.customer?.last_name}
                      </TableCell>
                      <TableCell>{vehicle.customer?.phone || vehicle.customer?.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getCategoryIcon(vehicle.vehicle_category)}
                          <span>{vehicle.vehicle_category || "Unknown"}</span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {onPageChange && onLimitChange && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Select value={String(itemsPerPage)} onValueChange={(value) => onLimitChange(Number.parseInt(value))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="10 per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Quick View Panel - Right Column */}
          <div className="col-span-1 hidden lg:block">
            {selectedVehicle ? (
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center mb-4">
                    <div className="h-24 w-24 mb-4 flex items-center justify-center bg-muted rounded-md">
                      {selectedVehicle.logo_image ? (
                        <img
                          src={selectedVehicle.logo_image || "/placeholder.svg"}
                          alt={`${selectedVehicle.make} logo`}
                          className="h-20 w-20 object-contain"
                        />
                      ) : (
                        getCategoryIcon(selectedVehicle.vehicle_category)
                      )}
                    </div>
                    <h2 className="text-xl font-bold">
                      {selectedVehicle.make} {selectedVehicle.model}
                    </h2>
                    <div className="text-muted-foreground">
                      {selectedVehicle.model_year ? `${selectedVehicle.model_year} • ` : ""}
                      {selectedVehicle.license_plate}
                    </div>
                    <Badge variant="outline" className="mt-2 flex items-center gap-1">
                      {getCategoryIcon(selectedVehicle.vehicle_category)}
                      <span>{selectedVehicle.vehicle_category || "Unknown"}</span>
                    </Badge>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Vehicle Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">VIN:</span>
                          <span className="text-sm font-medium">{selectedVehicle.vin || "Not provided"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Type:</span>
                          <span className="text-sm font-medium">{selectedVehicle.vehicle_type || "Not specified"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Engine:</span>
                          <span className="text-sm font-medium">{selectedVehicle.engine_type || "Not specified"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Fuel:</span>
                          <span className="text-sm font-medium">{selectedVehicle.fuel_type || "Not specified"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Transmission:</span>
                          <span className="text-sm font-medium">
                            {selectedVehicle.transmission_type || "Not specified"}
                          </span>
                        </div>
                        {selectedVehicle.mileage && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Mileage:</span>
                            <span className="text-sm font-medium">
                              {selectedVehicle.mileage.toLocaleString()} {selectedVehicle.mileage_unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Owner Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Name:</span>
                          <span className="text-sm font-medium">
                            {selectedVehicle.customer?.first_name} {selectedVehicle.customer?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Email:</span>
                          <span className="text-sm font-medium truncate max-w-[180px]">
                            {selectedVehicle.customer?.email}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Phone:</span>
                          <span className="text-sm font-medium">{selectedVehicle.customer?.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <Button className="w-full" onClick={() => onSelectVehicle(selectedVehicle)}>
                    View Full Details
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                  <Car className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Vehicle Selected</h3>
                  <p className="text-muted-foreground mb-4">Select a vehicle from the list to view its details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
