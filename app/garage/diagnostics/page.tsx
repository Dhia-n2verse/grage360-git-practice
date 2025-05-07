"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DiagnosticForm } from "@/components/diagnostics/diagnostic-form"
import { DiagnosticsList } from "@/components/diagnostics/diagnostics-list"
import { DiagnosticDetail } from "@/components/diagnostics/diagnostic-detail"
import { useAuth } from "@/app/context/auth-context"
import { getDiagnostics, type Diagnostic } from "@/lib/api/diagnostics"
import { Loader2, Plus, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

export default function DiagnosticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("list") // Default to list view
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<Diagnostic | null>(null)
  const [lastCreatedDiagnostic, setLastCreatedDiagnostic] = useState<Diagnostic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination and sorting state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filter, setFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  // Check user permissions
  const canRead = user?.role === "Manager" || user?.role === "Front Desk" || user?.role === "Technician"
  const canWrite = user?.role === "Manager" || user?.role === "Technician" || user?.role === "Front Desk"
  const canApprove = user?.role === "Manager" || user?.role === "Front Desk"

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

    fetchDiagnosticsData()

    // Set up real-time subscription for diagnostic changes
    const subscription = supabase
      .channel("diagnostics-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "diagnostics",
        },
        () => {
          fetchDiagnosticsData()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, page, limit, sortBy, sortOrder, filter, statusFilter])

  const fetchDiagnosticsData = async () => {
    setIsLoading(true)
    try {
      const { data, count, error } = await getDiagnostics(page, limit, sortBy, sortOrder, filter, statusFilter)

      if (error) throw error

      setDiagnostics(data || [])
      setTotalCount(count || 0)

      // Set the last created diagnostic
      if (data && data.length > 0) {
        setLastCreatedDiagnostic(data[0])
        if (!selectedDiagnostic) {
          setSelectedDiagnostic(data[0])
        }
      }
    } catch (err: any) {
      console.error("Error fetching diagnostics:", err)
      setError(err.message || "Failed to load diagnostics")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiagnosticCreated = (newDiagnostic: Diagnostic) => {
    toast({
      title: "Diagnostic Created",
      description: "The diagnostic has been created successfully.",
      duration: 4000,
    })

    // Refresh the diagnostic list
    fetchDiagnosticsData()

    // Switch to the view tab and select the new diagnostic
    setSelectedDiagnostic(newDiagnostic)
    setActiveTab("view")
  }

  const handleDiagnosticSelect = (diagnostic: Diagnostic) => {
    setSelectedDiagnostic(diagnostic)
    setActiveTab("view")
  }

  // Pagination and sorting handlers
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

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status === "all" ? undefined : status)
    setPage(1) // Reset to first page when changing status filter
  }

  const totalPages = Math.ceil(totalCount / limit)

  if (!canRead) {
    return null // Prevent flash of content before redirect
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Diagnostics</h2>
          <p className="text-muted-foreground">Manage vehicle diagnostics and reports.</p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <Button onClick={() => setActiveTab("create")}>
              <Plus className="mr-2 h-4 w-4" />
              New Diagnostic
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
          <TabsTrigger value="list">Diagnostics List</TabsTrigger>
          {canWrite && <TabsTrigger value="create">Create Diagnostic</TabsTrigger>}
          <TabsTrigger value="view">Diagnostic Details</TabsTrigger>
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
              </SelectContent>
            </Select>

            <Select value={statusFilter || "all"} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DiagnosticsList
              diagnostics={diagnostics}
              onSelectDiagnostic={handleDiagnosticSelect}
              canRead={canRead}
              selectedDiagnostic={selectedDiagnostic}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onFilterChange={handleFilterChange}
              currentPage={page}
              totalPages={totalPages}
              itemsPerPage={limit}
            />
          )}
        </TabsContent>

        {canWrite && (
          <TabsContent value="create" className="space-y-4">
            <DiagnosticForm onSuccess={handleDiagnosticCreated} canWrite={canWrite} />
          </TabsContent>
        )}

        <TabsContent value="view" className="space-y-4">
          {selectedDiagnostic ? (
            <DiagnosticDetail
              diagnostic={selectedDiagnostic}
              canWrite={canWrite}
              canApprove={canApprove}
              onDiagnosticUpdated={fetchDiagnosticsData}
            />
          ) : lastCreatedDiagnostic ? (
            <DiagnosticDetail
              diagnostic={lastCreatedDiagnostic}
              canWrite={canWrite}
              canApprove={canApprove}
              onDiagnosticUpdated={fetchDiagnosticsData}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No diagnostic selected</p>
              <Button onClick={() => setActiveTab("list")}>View Diagnostics List</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
