"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowUpDown,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Plus,
  Search,
  Settings,
  Wrench,
  XCircle,
  ChevronRight,
  X,
  Pencil,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/app/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import { getRepairs, getRepairById, type Repair, type RepairFilter, deleteRepair } from "@/lib/api/repairs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { RepairQuickView } from "@/components/repairs/repair-quick-view"
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
import { toast } from "@/components/ui/use-toast"

export function RepairsList() {
  const { user } = useAuth()
  const router = useRouter()
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [totalRepairs, setTotalRepairs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filter, setFilter] = useState<RepairFilter>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)
  const [lastClickTime, setLastClickTime] = useState<number>(0)

  const isReadOnly = user?.role === "Technician"

  useEffect(() => {
    fetchRepairs()
  }, [currentPage, pageSize, sortBy, sortOrder, filter])

  const fetchRepairs = async () => {
    setLoading(true)
    try {
      const { data, count } = await getRepairs(currentPage, pageSize, filter, sortBy, sortOrder)
      setRepairs(data)
      setTotalRepairs(count)
    } catch (error) {
      console.error("Failed to fetch repairs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const handleSearch = () => {
    setFilter({ ...filter, search: searchTerm })
    setCurrentPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    if (status === "all") {
      const { status, ...rest } = filter
      setFilter(rest)
    } else {
      setFilter({ ...filter, status })
    }
    setCurrentPage(1)
  }

  const handleRowClick = async (repair: Repair) => {
    const now = Date.now()
    const isDoubleClick = lastClickedId === repair.id && now - lastClickTime < 300

    setLastClickedId(repair.id!)
    setLastClickTime(now)

    if (isDoubleClick) {
      // Second click - navigate to full detail page
      router.push(`/garage/repairs/${repair.id}`)
    } else {
      // First click - show in quick view
      setLoading(true)
      try {
        const detailedRepair = await getRepairById(repair.id!)
        setSelectedRepair(detailedRepair)
        setQuickViewOpen(true)
      } catch (error) {
        console.error("Failed to fetch repair details:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const closeQuickView = () => {
    setQuickViewOpen(false)
    setSelectedRepair(null)
  }

  const totalPages = Math.ceil(totalRepairs / pageSize)

  const renderPagination = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={currentPage === i} onClick={() => setCurrentPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return (
      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationLink onClick={() => setCurrentPage(currentPage - 1)}>Previous</PaginationLink>
            </PaginationItem>
          )}
          {pages}
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationLink onClick={() => setCurrentPage(currentPage + 1)}>Next</PaginationLink>
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    )
  }

  const getStatusBadge = (status: string) => {
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

  const formatCurrency = (value?: number) => {
    if (value === undefined) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-bold tracking-tight">Repairs</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isReadOnly && (
            <Button onClick={() => router.push("/garage/repairs/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Repair
            </Button>
          )}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${quickViewOpen ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Repair Records</CardTitle>
                  <CardDescription>View and manage vehicle repairs</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search repairs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-[200px]"
                    />
                    <Button variant="ghost" size="icon" onClick={handleSearch}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Status</SelectLabel>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="InProgress">In Progress</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="list">
                <TabsList className="mb-4">
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                </TabsList>
                <TabsContent value="list">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort("created_at")}>
                              Date
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort("status")}>
                              Status
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort("progress")}>
                              Progress
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort("total_cost")}>
                              Total Cost
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>Technician</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-32" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-32" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-16" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-20" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-20" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : repairs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              No repairs found
                            </TableCell>
                          </TableRow>
                        ) : (
                          repairs.map((repair) => (
                            <TableRow
                              key={repair.id}
                              className={`hover:bg-muted/50 ${selectedRepair?.id === repair.id ? "bg-muted/50" : ""}`}
                            >
                              <TableCell onClick={() => handleRowClick(repair)} className="cursor-pointer">
                                {repair.created_at && format(new Date(repair.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell onClick={() => handleRowClick(repair)} className="cursor-pointer">
                                {repair.vehicle ? (
                                  <div>
                                    <div className="font-medium">
                                      {repair.vehicle.make} {repair.vehicle.model}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{repair.vehicle.license_plate}</div>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell onClick={() => handleRowClick(repair)} className="cursor-pointer">
                                {repair.customer ? (
                                  <div>
                                    <div className="font-medium">
                                      {repair.customer.first_name} {repair.customer.last_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{repair.customer.phone}</div>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell onClick={() => handleRowClick(repair)} className="cursor-pointer">
                                {getStatusBadge(repair.status)}
                              </TableCell>
                              <TableCell onClick={() => handleRowClick(repair)} className="cursor-pointer">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                  <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${repair.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-muted-foreground mt-1">{repair.progress}%</span>
                              </TableCell>
                              <TableCell onClick={() => handleRowClick(repair)} className="cursor-pointer">
                                {formatCurrency(repair.total_cost)}
                              </TableCell>
                              <TableCell onClick={() => handleRowClick(repair)} className="cursor-pointer">
                                {repair.technician_specialty ? (
                                  <div>
                                    <div className="font-medium">
                                      {repair.technician_specialty.technician?.full_name || "Unassigned"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {repair.technician_specialty.specialty?.name || ""}
                                    </div>
                                  </div>
                                ) : (
                                  "Unassigned"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {!isReadOnly && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/garage/repairs/edit/${repair.id}`)
                                      }}
                                      title="Edit repair"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/garage/repairs/${repair.id}`)
                                    }}
                                    title="View details"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                  {!isReadOnly && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="text-destructive border-destructive hover:bg-destructive/10"
                                          onClick={(e) => e.stopPropagation()}
                                          title="Delete repair"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Repair</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this repair? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={async () => {
                                              try {
                                                const { success, error } = await deleteRepair(repair.id!)
                                                if (success) {
                                                  toast({
                                                    title: "Repair deleted",
                                                    description: "The repair has been successfully deleted.",
                                                  })
                                                  fetchRepairs()
                                                } else {
                                                  throw error
                                                }
                                              } catch (err) {
                                                console.error("Error deleting repair:", err)
                                                toast({
                                                  variant: "destructive",
                                                  title: "Error",
                                                  description: "Failed to delete repair. Please try again.",
                                                })
                                              }
                                            }}
                                            className="bg-destructive text-destructive-foreground"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="grid">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index} className="cursor-pointer hover:bg-muted/50">
                          <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-6 w-24" />
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Skeleton className="h-4 w-20" />
                          </CardFooter>
                        </Card>
                      ))
                    ) : repairs.length === 0 ? (
                      <div className="col-span-full text-center py-4">No repairs found</div>
                    ) : (
                      repairs.map((repair) => (
                        <Card
                          key={repair.id}
                          className={`cursor-pointer hover:bg-muted/50 ${selectedRepair?.id === repair.id ? "bg-muted/50" : ""}`}
                          onClick={() => handleRowClick(repair)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                              {repair.vehicle?.make} {repair.vehicle?.model}
                            </CardTitle>
                            <CardDescription>{repair.vehicle?.license_plate}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="font-medium">Customer: </span>
                                {repair.customer?.first_name} {repair.customer?.last_name}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Date: </span>
                                {repair.created_at && format(new Date(repair.created_at), "MMM d, yyyy")}
                              </div>
                              <div>{getStatusBadge(repair.status)}</div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${repair.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground">{repair.progress}%</span>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <div className="text-sm font-medium">{formatCurrency(repair.total_cost)}</div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/garage/repairs/${repair.id}`)
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Showing {repairs.length} of {totalRepairs} repairs
                </div>
                {renderPagination()}
              </div>
            </CardFooter>
          </Card>
        </div>

        {quickViewOpen && (
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Quick View</CardTitle>
                  <CardDescription>Repair details</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={closeQuickView}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {selectedRepair ? (
                  <RepairQuickView
                    repair={selectedRepair}
                    onViewFull={() => router.push(`/garage/repairs/${selectedRepair.id}`)}
                    onEdit={() => router.push(`/garage/repairs/edit/${selectedRepair.id}`)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
