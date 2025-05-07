"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  UserCircle,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { getInitials, getRoleColor } from "@/lib/utils"
import { getVehiclesByCustomerId } from "@/lib/api/vehicles"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlphabeticPagination } from "@/components/alphabetic-pagination"

interface CustomerListProps {
  customers: any[]
  onSelectCustomer: (customer: any) => void
  canRead: boolean
  selectedCustomer: any | null
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  currentPage?: number
  totalPages?: number
  itemsPerPage?: number
}

export function CustomerList({
  customers,
  onSelectCustomer,
  canRead,
  selectedCustomer,
  onPageChange,
  onLimitChange,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 10,
}: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string | null>(null)
  const [nameFilter, setNameFilter] = useState("")
  const [phoneFilter, setPhoneFilter] = useState("")
  const [emailFilter, setEmailFilter] = useState("")
  const [customerVehicles, setCustomerVehicles] = useState<any[]>([])
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
  const [activeLetter, setActiveLetter] = useState<string | null>(null)

  // Fetch vehicles when a customer is selected
  useEffect(() => {
    if (selectedCustomer?.id) {
      fetchCustomerVehicles(selectedCustomer.id)
    }
  }, [selectedCustomer])

  const fetchCustomerVehicles = async (customerId: string) => {
    setIsLoadingVehicles(true)
    try {
      const { data, error } = await getVehiclesByCustomerId(customerId)
      if (error) throw error
      setCustomerVehicles(data || [])
    } catch (err) {
      console.error("Error fetching customer vehicles:", err)
    } finally {
      setIsLoadingVehicles(false)
    }
  }

  const handleLetterChange = (letter: string | null) => {
    setActiveLetter(letter)
    // Reset to first page when changing letter filter
    if (onPageChange) {
      onPageChange(1)
    }
  }

  if (!canRead) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to view customers.</p>
      </div>
    )
  }

  // Filter customers based on all filters
  const filteredCustomers = customers.filter((customer) => {
    // Skip disabled customers
    if (customer.status === "disabled") return false

    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase()
    const customerPhone = customer.phone?.toLowerCase() || ""
    const customerEmail = customer.email?.toLowerCase() || ""

    // Apply alphabetic filter
    if (activeLetter !== null) {
      const firstLetter = fullName.charAt(0).toUpperCase()
      if (firstLetter !== activeLetter) return false
    }

    // Apply all filters
    const matchesSearch =
      searchQuery === "" ||
      fullName.includes(searchQuery.toLowerCase()) ||
      customerEmail.includes(searchQuery.toLowerCase()) ||
      customerPhone.includes(searchQuery.toLowerCase()) ||
      customer.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filterType === null || customer.type === filterType

    const matchesNameFilter = nameFilter === "" || fullName.includes(nameFilter.toLowerCase())
    const matchesPhoneFilter = phoneFilter === "" || customerPhone.includes(phoneFilter.toLowerCase())
    const matchesEmailFilter = emailFilter === "" || customerEmail.includes(emailFilter.toLowerCase())

    return matchesSearch && matchesType && matchesNameFilter && matchesPhoneFilter && matchesEmailFilter
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
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
                <label className="text-xs font-medium mb-1 block">Name</label>
                <Input
                  placeholder="Filter by name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="mb-2"
                />

                <label className="text-xs font-medium mb-1 block">Phone</label>
                <Input
                  placeholder="Filter by phone"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  className="mb-2"
                />

                <label className="text-xs font-medium mb-1 block">Email</label>
                <Input
                  placeholder="Filter by email"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="mb-2"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Filter className="mr-2 h-4 w-4" />
                Type
                {filterType && (
                  <Badge variant="secondary" className="ml-2">
                    {filterType}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType(null)}>All Customers</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("personal")}>
                <UserCircle className="mr-2 h-4 w-4" />
                Personal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("business")}>
                <Briefcase className="mr-2 h-4 w-4" />
                Business
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Alphabetic Pagination */}
      <AlphabeticPagination activeLetter={activeLetter} onLetterChange={handleLetterChange} />

      {filteredCustomers.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No customers found</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Customer List - Left Column */}
          <div className="col-span-1 lg:col-span-2">
            <div className="space-y-2">
              {filteredCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedCustomer?.id === customer.id ? "border-primary bg-muted/50" : ""
                  }`}
                  onClick={() => onSelectCustomer(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarFallback className={getRoleColor(customer.role)}>
                          {getInitials(`${customer.first_name} ${customer.last_name}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">
                              {customer.first_name} {customer.last_name}
                            </h3>
                            <Badge
                              variant={customer.type === "business" ? "default" : "secondary"}
                              className={`md:hidden ${
                                customer.type === "business"
                                  ? "bg-emerald-500 hover:bg-emerald-600"
                                  : "bg-blue-500 hover:bg-blue-600"
                              }`}
                            >
                              {customer.type === "business" ? (
                                <Briefcase className="mr-1 h-3 w-3" />
                              ) : (
                                <UserCircle className="mr-1 h-3 w-3" />
                              )}
                              {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
                            </Badge>
                          </div>
                          {customer.type === "business" && (
                            <div className="text-sm font-medium">{customer.company_name}</div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="hidden md:flex items-center justify-end">
                            <Badge
                              variant={customer.type === "business" ? "default" : "secondary"}
                              className={
                                customer.type === "business"
                                  ? "bg-emerald-500 hover:bg-emerald-600"
                                  : "bg-blue-500 hover:bg-blue-600"
                              }
                            >
                              {customer.type === "business" ? (
                                <Briefcase className="mr-1 h-3 w-3" />
                              ) : (
                                <UserCircle className="mr-1 h-3 w-3" />
                              )}
                              {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-start text-sm">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="truncate">{customer.address}</div>
                              {(customer.city || customer.state || customer.postal_code) && (
                                <div className="text-muted-foreground truncate">
                                  {customer.city}
                                  {customer.state ? `, ${customer.state}` : ""}
                                  {customer.postal_code ? ` ${customer.postal_code}` : ""}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
            {selectedCustomer ? (
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center mb-4">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarFallback className={getRoleColor(selectedCustomer.role)}>
                        {getInitials(`${selectedCustomer.first_name} ${selectedCustomer.last_name}`)}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                    </h2>
                    <Badge
                      variant={selectedCustomer.type === "business" ? "default" : "secondary"}
                      className={`mt-2 ${
                        selectedCustomer.type === "business"
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {selectedCustomer.type === "business" ? (
                        <Briefcase className="mr-1 h-3 w-3" />
                      ) : (
                        <UserCircle className="mr-1 h-3 w-3" />
                      )}
                      {selectedCustomer.type.charAt(0).toUpperCase() + selectedCustomer.type.slice(1)}
                    </Badge>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{selectedCustomer.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{selectedCustomer.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Address</h3>
                      <div className="space-y-1">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                          <div>
                            <p>{selectedCustomer.address}</p>
                            {(selectedCustomer.city || selectedCustomer.state || selectedCustomer.postal_code) && (
                              <p>
                                {selectedCustomer.city}
                                {selectedCustomer.state ? `, ${selectedCustomer.state}` : ""}
                                {selectedCustomer.postal_code ? ` ${selectedCustomer.postal_code}` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <Button className="w-full" onClick={() => onSelectCustomer(selectedCustomer)}>
                    View Full Details
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                  <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Customer Selected</h3>
                  <p className="text-muted-foreground mb-4">Select a customer from the list to view their details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
