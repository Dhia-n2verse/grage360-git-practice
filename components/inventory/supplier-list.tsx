"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building, Download, FileUp, Phone, Mail, Globe, Plus, Search, Star } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getSuppliers,
  type Supplier,
  type ProductCategory,
  type SupplierFilter,
  generateSuppliersCsv,
} from "@/lib/api/inventory"

export function SupplierList() {
  const { user } = useAuth()
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [totalSuppliers, setTotalSuppliers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [filter, setFilter] = useState<SupplierFilter>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const isReadOnly = user?.role === "Technician"

  const productCategories: ProductCategory[] = [
    "Engine Components",
    "Oils & Filters",
    "Wheels & Brakes",
    "Electrical Components",
    "Transmission & Clutch",
    "Suspension Systems",
    "Body & Trim",
    "Other",
  ]

  useEffect(() => {
    fetchSuppliers()
  }, [currentPage, pageSize, filter])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const { data, count } = await getSuppliers(currentPage, pageSize, filter)
      setSuppliers(data)
      setTotalSuppliers(count)
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    // For simplicity, we'll just filter by name on the client side
    // In a real app, you'd want to do this on the server
    fetchSuppliers()
  }

  const handleSpecialityFilter = (speciality: ProductCategory | "all") => {
    if (speciality === "all") {
      const { speciality, ...rest } = filter
      setFilter(rest)
    } else {
      setFilter({ ...filter, speciality: speciality as ProductCategory })
    }
    setCurrentPage(1)
  }

  const handleExportCsv = () => {
    const csv = generateSuppliersCsv(suppliers)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "suppliers.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalPages = Math.ceil(totalSuppliers / pageSize)

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-bold tracking-tight">Suppliers</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isReadOnly && (
            <Button onClick={() => router.push("/inventory/suppliers/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Supplier
            </Button>
          )}
          {user?.role === "Manager" && (
            <>
              <Button variant="outline" onClick={handleExportCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline">
                <FileUp className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Supplier Directory</CardTitle>
              <CardDescription>Manage your suppliers and vendor relationships</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[200px]"
                />
                <Button variant="ghost" size="icon" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Select onValueChange={(value) => handleSpecialityFilter(value as ProductCategory | "all")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by speciality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Specialities</SelectLabel>
                    <SelectItem value="all">All Specialities</SelectItem>
                    {productCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-4">Loading...</div>
            ) : suppliers.length === 0 ? (
              <div className="col-span-full text-center py-4">No suppliers found</div>
            ) : (
              suppliers.map((supplier) => (
                <Card
                  key={supplier.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{supplier.name}</CardTitle>
                        <CardDescription>
                          {supplier.speciality && supplier.speciality.length > 0
                            ? supplier.speciality.join(", ")
                            : "No speciality listed"}
                        </CardDescription>
                      </div>
                      {supplier.rank_item && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm ml-1">{supplier.rank_item}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {supplier.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{supplier.phone_number}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      {supplier.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{supplier.website}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex flex-wrap gap-1">
                      {supplier.recommended_vehicle_make &&
                        supplier.recommended_vehicle_make.map((make, index) => (
                          <Badge key={index} variant="outline">
                            {make}
                          </Badge>
                        ))}
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {suppliers.length} of {totalSuppliers} suppliers
            </div>
            {renderPagination()}
          </div>
        </CardFooter>
      </Card>

      <Dialog open={!!selectedSupplier} onOpenChange={(open) => !open && setSelectedSupplier(null)}>
        {selectedSupplier && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedSupplier.name}</DialogTitle>
              <DialogDescription>
                {selectedSupplier.speciality && selectedSupplier.speciality.length > 0
                  ? `Specializes in ${selectedSupplier.speciality.join(", ")}`
                  : "No speciality listed"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Contact Information</h3>
                  <div className="text-sm space-y-1">
                    {selectedSupplier.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedSupplier.phone_number}</span>
                      </div>
                    )}
                    {selectedSupplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedSupplier.email}</span>
                      </div>
                    )}
                    {selectedSupplier.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={selectedSupplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          {selectedSupplier.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Address</h3>
                  <p className="text-sm">{selectedSupplier.address || "No address provided"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Recommended Vehicle Makes</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedSupplier.recommended_vehicle_make && selectedSupplier.recommended_vehicle_make.length > 0 ? (
                    selectedSupplier.recommended_vehicle_make.map((make, index) => (
                      <Badge key={index} variant="outline">
                        {make}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No recommended makes</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Specialities</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedSupplier.speciality && selectedSupplier.speciality.length > 0 ? (
                    selectedSupplier.speciality.map((spec, index) => (
                      <Badge key={index} variant="secondary">
                        {spec}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No specialities listed</span>
                  )}
                </div>
              </div>

              {selectedSupplier.rank_item && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Supplier Ranking</h3>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < selectedSupplier.rank_item! ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm">{selectedSupplier.rank_item} out of 5</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setSelectedSupplier(null)}>
                Close
              </Button>
              {!isReadOnly && (
                <Button onClick={() => router.push(`/inventory/suppliers/edit/${selectedSupplier.id}`)}>
                  Edit Supplier
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
