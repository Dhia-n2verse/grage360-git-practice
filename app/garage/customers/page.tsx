"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerRegistrationForm } from "@/components/customers/customer-registration-form"
import { CustomerDetail } from "@/components/customers/customer-detail"
import { CustomerGridView } from "@/components/customers/customer-grid-view"
import { CustomerQuickView } from "@/components/customers/customer-quick-view"
import { useAuth } from "@/app/context/auth-context"
import { supabase } from "@/lib/supabase"
import { Loader2, Plus, Download, Upload, LayoutGrid, List } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Update the fetchCustomers function to support pagination, sorting, and alphabetic filtering
const fetchCustomers = async (
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "desc",
  letterFilter: string | null = null,
) => {
  try {
    // Calculate range for pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query with pagination and sorting
    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .order(sortBy, { ascending: sortOrder === "asc" })

    // Apply letter filter if provided
    if (letterFilter) {
      // Filter by first letter of first_name
      query = query.ilike("first_name", `${letterFilter}%`)
    }

    // Filter out disabled customers
    query = query.neq("status", "disabled")

    // Apply pagination
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return { data: data || [], count: count || 0, error: null }
  } catch (err) {
    console.error("Error fetching customers:", err)
    return { data: [], count: 0, error: err }
  }
}

// Function to fetch the most recently created customer
const fetchLastRegisteredCustomer = async () => {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .neq("status", "disabled")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Error fetching last registered customer:", err)
    return { data: null, error: err }
  }
}

export default function CustomersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("list") // Default to list view
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid") // Default to grid view
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [lastRegisteredCustomer, setLastRegisteredCustomer] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination and sorting state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [letterFilter, setLetterFilter] = useState<string | null>(null)

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

    fetchCustomersData()
    fetchLastRegistered()

    // Set up real-time subscription for customer changes
    const subscription = supabase
      .channel("customers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
        },
        () => {
          fetchCustomersData()
          fetchLastRegistered()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // Fetch customers when pagination, sorting, or filtering changes
  useEffect(() => {
    fetchCustomersData()
  }, [page, limit, sortBy, sortOrder, letterFilter])

  const fetchCustomersData = async () => {
    setIsLoading(true)
    try {
      const { data, count, error } = await fetchCustomers(page, limit, sortBy, sortOrder, letterFilter)

      if (error) throw error

      setCustomers(data || [])
      setTotalCount(count || 0)

      // If no customer is selected yet, select the first one from the results
      if (!selectedCustomer && data && data.length > 0) {
        setSelectedCustomer(data[0])
      }
    } catch (err: any) {
      console.error("Error fetching customers:", err)
      setError(err.message || "Failed to load customers")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLastRegistered = async () => {
    try {
      const { data, error } = await fetchLastRegisteredCustomer()

      if (error) throw error

      if (data) {
        setLastRegisteredCustomer(data)
        // If no customer is selected, select the last registered one
        if (!selectedCustomer) {
          setSelectedCustomer(data)
        }
      }
    } catch (err: any) {
      console.error("Error fetching last registered customer:", err)
    }
  }

  const handleCustomerRegistered = (newCustomer: any) => {
    toast({
      title: "Registration Successful",
      description: `${newCustomer.first_name} ${newCustomer.last_name} has been registered successfully.`,
      duration: 4000,
    })

    // Refresh the customer list
    fetchCustomersData()
    fetchLastRegistered()

    // Set the newly registered customer as selected
    setSelectedCustomer(newCustomer)

    // Switch to the list view after registration
    setActiveTab("list")
  }

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer)
  }

  const handleViewDetails = () => {
    if (selectedCustomer) {
      setActiveTab("view")
    }
  }

  const handleExportCustomers = () => {
    if (!canExportImport) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to export customer data.",
      })
      return
    }

    try {
      // Filter out sensitive data and prepare for export
      const exportData = customers.map((customer) => ({
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        postal_code: customer.postal_code,
        type: customer.type,
        company_name: customer.company_name,
        fiscal_id: customer.fiscal_id,
        created_at: customer.created_at,
      }))

      // Create a JSON blob and download it
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `customers-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `${exportData.length} customers exported successfully.`,
      })
    } catch (err: any) {
      console.error("Error exporting customers:", err)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err.message || "Failed to export customers. Please try again.",
      })
    }
  }

  const handleImportCustomers = () => {
    if (!canExportImport) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to import customer data.",
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
            const customersData = JSON.parse(event.target?.result as string)

            // Validate the data structure
            if (!Array.isArray(customersData)) {
              throw new Error("Invalid import format. Expected an array of customers.")
            }

            // Process each customer
            let successCount = 0
            let errorCount = 0

            for (const customer of customersData) {
              // Basic validation
              if (!customer.first_name || !customer.last_name || !customer.email) {
                errorCount++
                continue
              }

              // Check if customer already exists
              const { data: existingCustomer } = await supabase
                .from("customers")
                .select("id")
                .eq("email", customer.email)
                .maybeSingle()

              if (existingCustomer) {
                // Update existing customer
                const { error } = await supabase
                  .from("customers")
                  .update({
                    first_name: customer.first_name,
                    last_name: customer.last_name,
                    phone: customer.phone,
                    address: customer.address,
                    city: customer.city,
                    state: customer.state,
                    postal_code: customer.postal_code,
                    type: customer.type,
                    company_name: customer.company_name,
                    fiscal_id: customer.fiscal_id,
                  })
                  .eq("id", existingCustomer.id)

                if (error) {
                  errorCount++
                } else {
                  successCount++
                }
              } else {
                // Insert new customer
                const { error } = await supabase.from("customers").insert([
                  {
                    first_name: customer.first_name,
                    last_name: customer.last_name,
                    email: customer.email,
                    phone: customer.phone,
                    address: customer.address,
                    city: customer.city,
                    state: customer.state,
                    postal_code: customer.postal_code,
                    type: customer.type,
                    company_name: customer.company_name,
                    fiscal_id: customer.fiscal_id,
                  },
                ])

                if (error) {
                  errorCount++
                } else {
                  successCount++
                }
              }
            }

            // Refresh the customer list
            fetchCustomersData()
            fetchLastRegistered()

            toast({
              title: "Import Complete",
              description: `Successfully processed ${successCount} customers. ${
                errorCount > 0 ? `Failed to process ${errorCount} customers.` : ""
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
        console.error("Error importing customers:", err)
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: err.message || "Failed to import customers. Please try again.",
        })
      }
    }

    fileInput.click()
  }

  // Pagination and sorting handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when changing limit
  }

  const handleSortChange = (field: string, order: "asc" | "desc") => {
    setSortBy(field)
    setSortOrder(order)
    setPage(1) // Reset to first page when changing sort
  }

  const handleLetterFilterChange = (letter: string | null) => {
    setLetterFilter(letter)
    setPage(1) // Reset to first page when changing letter filter
  }

  const totalPages = Math.ceil(totalCount / limit)

  if (!canRead) {
    return null // Prevent flash of content before redirect
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">Manage your customer database and registrations.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md mr-2">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {canExportImport && (
            <>
              <Button variant="outline" onClick={handleExportCustomers}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" onClick={handleImportCustomers}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </>
          )}
          {canWrite && (
            <Button onClick={() => setActiveTab("register")}>
              <Plus className="mr-2 h-4 w-4" />
              New Customer
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
          <TabsTrigger value="list">Customer List</TabsTrigger>
          {canWrite && <TabsTrigger value="register">Register Customer</TabsTrigger>}
          <TabsTrigger value="view">Customer Details</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split("-")
                handleSortChange(field, order as "asc" | "desc")
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="first_name-asc">First Name (A-Z)</SelectItem>
                <SelectItem value="first_name-desc">First Name (Z-A)</SelectItem>
                <SelectItem value="last_name-asc">Last Name (A-Z)</SelectItem>
                <SelectItem value="last_name-desc">Last Name (Z-A)</SelectItem>
                <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                <SelectItem value="email-desc">Email (Z-A)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(limit)} onValueChange={(value) => handleLimitChange(Number.parseInt(value))}>
              <SelectTrigger className="w-[130px]">
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

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
              {/* Customer List/Grid - Left Column */}
              <div className="col-span-1 lg:col-span-2">
                <CustomerGridView
                  customers={customers}
                  onSelectCustomer={handleCustomerSelect}
                  selectedCustomer={selectedCustomer}
                  onPageChange={handlePageChange}
                  onSortChange={handleSortChange}
                  onLetterChange={handleLetterFilterChange}
                  currentPage={page}
                  totalPages={totalPages}
                  activeLetter={letterFilter}
                  sortField={sortBy}
                  sortOrder={sortOrder}
                />
              </div>

              {/* Quick View Panel - Right Column */}
              <div className="col-span-1 hidden lg:block">
                <CustomerQuickView
                  customer={selectedCustomer || lastRegisteredCustomer}
                  onViewDetails={handleViewDetails}
                />
              </div>
            </div>
          )}
        </TabsContent>

        {canWrite && (
          <TabsContent value="register" className="space-y-4">
            <CustomerRegistrationForm onCustomerRegistered={handleCustomerRegistered} canWrite={canWrite} />
          </TabsContent>
        )}

        <TabsContent value="view" className="space-y-4">
          {selectedCustomer ? (
            <CustomerDetail
              customer={selectedCustomer}
              canWrite={canWrite}
              canDisable={canDisable}
              onCustomerUpdated={() => {
                fetchCustomersData()
                fetchLastRegistered()
              }}
            />
          ) : lastRegisteredCustomer ? (
            <CustomerDetail
              customer={lastRegisteredCustomer}
              canWrite={canWrite}
              canDisable={canDisable}
              onCustomerUpdated={() => {
                fetchCustomersData()
                fetchLastRegistered()
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-muted-foreground mb-4">No customer selected</p>
              <Button onClick={() => setActiveTab("list")}>View Customer List</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
