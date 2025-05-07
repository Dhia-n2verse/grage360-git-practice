"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Car,
  User,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Diagnostic } from "@/lib/api/diagnostics"

interface DiagnosticsListProps {
  diagnostics: Diagnostic[]
  onSelectDiagnostic: (diagnostic: Diagnostic) => void
  canRead: boolean
  selectedDiagnostic: Diagnostic | null
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  onFilterChange?: (filter: string) => void
  currentPage?: number
  totalPages?: number
  itemsPerPage?: number
}

export function DiagnosticsList({
  diagnostics,
  onSelectDiagnostic,
  canRead,
  selectedDiagnostic,
  onPageChange,
  onLimitChange,
  onFilterChange,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 10,
}: DiagnosticsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  if (!canRead) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to view diagnostics.</p>
      </div>
    )
  }

  // Filter diagnostics based on search and status
  const filteredDiagnostics = diagnostics.filter((diagnostic) => {
    const vehicleInfo = `${diagnostic.vehicle?.make || ""} ${diagnostic.vehicle?.model || ""} ${
      diagnostic.vehicle?.license_plate || ""
    }`.toLowerCase()
    const customerInfo = `${diagnostic.customer?.first_name || ""} ${diagnostic.customer?.last_name || ""} ${
      diagnostic.customer?.email || ""
    }`.toLowerCase()
    const diagnosticContent = `${diagnostic.observation || ""} ${diagnostic.recommendation || ""}`.toLowerCase()
    const errorCodes = diagnostic.error_codes
      .map((code) => `${code.code} ${code.severity} ${code.related_system} ${code.recommendation}`)
      .join(" ")
      .toLowerCase()
    const systemChecks = diagnostic.system_checks.join(" ").toLowerCase()

    // Apply search filter
    const matchesSearch =
      searchQuery === "" ||
      vehicleInfo.includes(searchQuery.toLowerCase()) ||
      customerInfo.includes(searchQuery.toLowerCase()) ||
      diagnosticContent.includes(searchQuery.toLowerCase()) ||
      errorCodes.includes(searchQuery.toLowerCase()) ||
      systemChecks.includes(searchQuery.toLowerCase()) ||
      diagnostic.id?.toString().includes(searchQuery.toLowerCase())

    // Apply status filter
    const matchesStatus = statusFilter === null || diagnostic.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Sort diagnostics
  const sortedDiagnostics = [...filteredDiagnostics].sort((a, b) => {
    let valueA, valueB

    switch (sortField) {
      case "created_at":
        valueA = a.created_at ? new Date(a.created_at).getTime() : 0
        valueB = b.created_at ? new Date(b.created_at).getTime() : 0
        break
      case "vehicle":
        valueA = `${a.vehicle?.make || ""} ${a.vehicle?.model || ""}`.toLowerCase()
        valueB = `${b.vehicle?.make || ""} ${b.vehicle?.model || ""}`.toLowerCase()
        break
      case "customer":
        valueA = `${a.customer?.first_name || ""} ${a.customer?.last_name || ""}`.toLowerCase()
        valueB = `${b.customer?.first_name || ""} ${b.customer?.last_name || ""}`.toLowerCase()
        break
      case "status":
        valueA = a.status || ""
        valueB = b.status || ""
        break
      case "severity":
        valueA = getHighestSeverityValue(a)
        valueB = getHighestSeverityValue(b)
        break
      default:
        valueA = a.created_at ? new Date(a.created_at).getTime() : 0
        valueB = b.created_at ? new Date(b.created_at).getTime() : 0
    }

    if (sortDirection === "asc") {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
    }
  })

  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not available"
    try {
      return format(new Date(dateString), "PPP")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Get highest severity from error codes
  const getHighestSeverity = (diagnostic: Diagnostic) => {
    if (!diagnostic.error_codes || diagnostic.error_codes.length === 0) {
      return "None"
    }

    const severityOrder = {
      Critical: 4,
      High: 3,
      Moderate: 2,
      Low: 1,
      None: 0,
    }

    return diagnostic.error_codes.reduce(
      (highest, current) => {
        const currentValue = severityOrder[current.severity as keyof typeof severityOrder] || 0
        const highestValue = severityOrder[highest as keyof typeof severityOrder] || 0
        return currentValue > highestValue ? current.severity : highest
      },
      "None" as "None" | "Low" | "Moderate" | "High" | "Critical",
    )
  }

  // Get numeric value for severity (for sorting)
  const getHighestSeverityValue = (diagnostic: Diagnostic) => {
    const severity = getHighestSeverity(diagnostic)
    const severityValues = {
      Critical: 4,
      High: 3,
      Moderate: 2,
      Low: 1,
      None: 0,
    }
    return severityValues[severity as keyof typeof severityValues] || 0
  }

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <Badge variant="destructive">Critical</Badge>
      case "High":
        return (
          <Badge variant="destructive" className="bg-orange-500">
            High
          </Badge>
        )
      case "Moderate":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Moderate
          </Badge>
        )
      case "Low":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Low
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100">
            None
          </Badge>
        )
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "Rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Pending
          </Badge>
        )
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    if (onFilterChange) {
      onFilterChange(value)
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
            placeholder="Search diagnostics by ID, vehicle, customer, error codes..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Filter className="mr-2 h-4 w-4" />
                Status
                {statusFilter && (
                  <Badge variant="secondary" className="ml-2">
                    {statusFilter}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>All Statuses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Pending")}>
                <AlertTriangle className="mr-2 h-4 w-4 text-blue-500" />
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Approved")}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                Approved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Rejected")}>
                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                Rejected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {sortedDiagnostics.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No diagnostics found</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Diagnostics List - Left Column */}
          <div className="col-span-1 lg:col-span-2">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer w-[100px]" onClick={() => handleSortChange("created_at")}>
                      <div className="flex items-center">Date {getSortIcon("created_at")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSortChange("vehicle")}>
                      <div className="flex items-center">Vehicle {getSortIcon("vehicle")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSortChange("customer")}>
                      <div className="flex items-center">Customer {getSortIcon("customer")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSortChange("severity")}>
                      <div className="flex items-center">Severity {getSortIcon("severity")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSortChange("status")}>
                      <div className="flex items-center">Status {getSortIcon("status")}</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDiagnostics.map((diagnostic) => (
                    <TableRow
                      key={diagnostic.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedDiagnostic?.id === diagnostic.id ? "bg-muted/50" : ""
                      }`}
                      onClick={() => onSelectDiagnostic(diagnostic)}
                    >
                      <TableCell className="font-medium">
                        {diagnostic.created_at ? formatDate(diagnostic.created_at) : "N/A"}
                      </TableCell>
                      <TableCell>
                        {diagnostic.vehicle?.make} {diagnostic.vehicle?.model}
                        <div className="text-xs text-muted-foreground">{diagnostic.vehicle?.license_plate}</div>
                      </TableCell>
                      <TableCell>
                        {diagnostic.customer?.first_name} {diagnostic.customer?.last_name}
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {diagnostic.customer?.email}
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(getHighestSeverity(diagnostic))}</TableCell>
                      <TableCell>{getStatusBadge(diagnostic.status || "Pending")}</TableCell>
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
            {selectedDiagnostic ? (
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center mb-4">
                    <div className="flex items-center justify-center mb-2">
                      {getStatusBadge(selectedDiagnostic.status || "Pending")}
                    </div>
                    <h2 className="text-xl font-bold">Diagnostic #{selectedDiagnostic.id}</h2>
                    <div className="text-sm text-muted-foreground">
                      Created: {formatDate(selectedDiagnostic.created_at)}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Vehicle Information</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {selectedDiagnostic.vehicle?.make} {selectedDiagnostic.vehicle?.model}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedDiagnostic.vehicle?.model_year ? `${selectedDiagnostic.vehicle.model_year} • ` : ""}
                        {selectedDiagnostic.vehicle?.license_plate}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Customer Information</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {selectedDiagnostic.customer?.first_name} {selectedDiagnostic.customer?.last_name}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{selectedDiagnostic.customer?.email}</div>
                      <div className="text-sm text-muted-foreground">{selectedDiagnostic.customer?.phone}</div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Systems Checked</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedDiagnostic.system_checks.map((system, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Severity</h3>
                      <div className="flex items-center gap-2">
                        <span>Highest Severity:</span>
                        {getSeverityBadge(getHighestSeverity(selectedDiagnostic))}
                      </div>
                    </div>

                    {selectedDiagnostic.error_codes.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Error Codes</h3>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                          {selectedDiagnostic.error_codes.slice(0, 3).map((errorCode, index) => (
                            <div key={index} className="border rounded-md p-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{errorCode.code}</span>
                                {getSeverityBadge(errorCode.severity)}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{errorCode.related_system}</div>
                            </div>
                          ))}
                          {selectedDiagnostic.error_codes.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{selectedDiagnostic.error_codes.length - 3} more error codes
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <Button className="w-full" onClick={() => onSelectDiagnostic(selectedDiagnostic)}>
                    View Full Details
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                  <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Diagnostic Selected</h3>
                  <p className="text-muted-foreground mb-4">Select a diagnostic from the list to view its details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
