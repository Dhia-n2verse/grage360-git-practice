"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowUpDown, Download, FileUp, Plus, Search, ShoppingBag } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import {
  getStockItems,
  getStockOrdersWithSupplier,
  type StockItem,
  type ProductCategory,
  type StockFilter,
  generateStockCsv,
} from "@/lib/api/inventory"
import { OrderFormModal } from "./order-form-modal"
import { OrdersList } from "./orders-list" // Import the new OrdersList component

export function StockList() {
  const { user } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<StockItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewMode, setViewMode] = useState<"list" | "orders">("list")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [filter, setFilter] = useState<StockFilter>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [orderHistory, setOrderHistory] = useState<any[]>([])

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
    fetchItems()
  }, [currentPage, pageSize, sortBy, sortOrder, filter])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const { data, count } = await getStockItems(currentPage, pageSize, filter, sortBy, sortOrder)
      setItems(data)
      setTotalItems(count)
    } catch (error) {
      console.error("Failed to fetch stock items:", error)
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
    setFilter({ ...filter, name: searchTerm })
    setCurrentPage(1)
  }

  const handleCategoryFilter = (category: ProductCategory | "all") => {
    if (category === "all") {
      const { category, ...rest } = filter
      setFilter(rest)
    } else {
      setFilter({ ...filter, category })
    }
    setCurrentPage(1)
  }

  const handleLowStockFilter = (checked: boolean) => {
    setFilter({ ...filter, lowStock: checked })
    setCurrentPage(1)
  }

  const handleExportCsv = () => {
    const csv = generateStockCsv(items)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "stock_items.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalPages = Math.ceil(totalItems / pageSize)

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

  const formatCurrency = (value?: number) => {
    if (value === undefined) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const handleSelectItem = async (item: StockItem) => {
    setSelectedItem(item)
    if (item.id) {
      try {
        const orders = await getStockOrdersWithSupplier(item.id)
        setOrderHistory(orders)
      } catch (error) {
        console.error("Failed to fetch order history:", error)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-bold tracking-tight">Stock Tracking</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isReadOnly && (
            <Button onClick={() => router.push("/inventory/stock/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Product
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

      {/* Modified layout to include OrdersList on the left for Grid View */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Inventory Items</CardTitle>
                  <CardDescription>Manage your stock and inventory items</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-[200px]"
                    />
                    <Button variant="ghost" size="icon" onClick={handleSearch}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select onValueChange={(value) => handleCategoryFilter(value as ProductCategory | "all")}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Categories</SelectLabel>
                        <SelectItem value="all">All Categories</SelectItem>
                        {productCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="lowStock"
                      checked={!!filter.lowStock}
                      onChange={(e) => handleLowStockFilter(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="lowStock" className="text-sm">
                      Low Stock Only
                    </label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "orders")}>
                <TabsList className="mb-4">
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                </TabsList>
                <TabsContent value="list">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort("name")}>
                              Product Name
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort("quantity")}>
                              Quantity
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => handleSort("unit_selling_price")}
                            >
                              Selling Price
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => handleSort("unit_purchase_price")}
                            >
                              Purchase Price
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>Supplier</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No items found
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((item) => (
                            <TableRow
                              key={item.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSelectItem(item)}
                            >
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.category && <Badge variant="outline">{item.category}</Badge>}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {item.quantity}
                                  {item.minimum_quantity_to_order !== undefined &&
                                    item.quantity < item.minimum_quantity_to_order && (
                                      <AlertCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(item.unit_selling_price)}</TableCell>
                              <TableCell>{formatCurrency(item.unit_purchase_price)}</TableCell>
                              <TableCell>{item.supplier?.name || "-"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="orders">
                  <OrdersList />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Showing {items.length} of {totalItems} items
                </div>
                {renderPagination()}
              </div>
            </CardFooter>
          </Card>
        </div>

        {selectedItem && (
          <div className="w-full md:w-96">
            <Card>
              <CardHeader>
                <CardTitle>{selectedItem.name}</CardTitle>
                <CardDescription>{selectedItem.part_reference || "No reference"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedItem.minimum_quantity_to_order !== undefined &&
                  selectedItem.quantity < selectedItem.minimum_quantity_to_order && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Low Stock Alert</AlertTitle>
                      <AlertDescription>
                        Current quantity ({selectedItem.quantity}) is below the minimum order quantity (
                        {selectedItem.minimum_quantity_to_order}).
                      </AlertDescription>
                    </Alert>
                  )}

                <div className="space-y-2">
                  <h3 className="font-medium">Product Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Category:</div>
                    <div>{selectedItem.category || "Uncategorized"}</div>
                    <div className="font-medium">Quantity:</div>
                    <div>{selectedItem.quantity}</div>
                    <div className="font-medium">Min. Order Qty:</div>
                    <div>{selectedItem.minimum_quantity_to_order || "Not set"}</div>
                    <div className="font-medium">Selling Price:</div>
                    <div>{formatCurrency(selectedItem.unit_selling_price)}</div>
                    <div className="font-medium">Purchase Price:</div>
                    <div>{formatCurrency(selectedItem.unit_purchase_price)}</div>
                    <div className="font-medium">Total Value:</div>
                    <div>{formatCurrency((selectedItem.unit_purchase_price || 0) * selectedItem.quantity)}</div>
                  </div>
                </div>

                {selectedItem.product_description && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Description</h3>
                    <p className="text-sm">{selectedItem.product_description}</p>
                  </div>
                )}

                {selectedItem.supplier && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Supplier Information</h3>
                    <div className="text-sm space-y-1">
                      <div className="font-medium">{selectedItem.supplier.name}</div>
                      {selectedItem.supplier.phone_number && <div>{selectedItem.supplier.phone_number}</div>}
                      {selectedItem.supplier.email && <div>{selectedItem.supplier.email}</div>}
                    </div>
                  </div>
                )}
                {orderHistory.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h3 className="font-medium">Order History</h3>
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Date</th>
                            <th className="text-left py-2">Qty</th>
                            <th className="text-left py-2">Price</th>
                            <th className="text-left py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderHistory.map((order) => (
                            <tr key={order.id} className="border-b border-muted">
                              <td className="py-2">{new Date(order.order_date).toLocaleDateString()}</td>
                              <td className="py-2">{order.quantity}</td>
                              <td className="py-2">{formatCurrency(order.total_price)}</td>
                              <td className="py-2">
                                <Badge variant={order.order_status === "Shipped" ? "success" : "outline"}>
                                  {order.order_status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={() => setSelectedItem(null)}>
                  Close
                </Button>
                <div className="flex gap-2">
                  {!isReadOnly && (
                    <Button variant="outline" onClick={() => router.push(`/inventory/stock/edit/${selectedItem.id}`)}>
                      Edit
                    </Button>
                  )}
                  <Button onClick={() => setOrderModalOpen(true)}>Order</Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
        {selectedItem && (
          <OrderFormModal
            stockItem={selectedItem}
            isOpen={orderModalOpen}
            onClose={() => setOrderModalOpen(false)}
            onOrderComplete={fetchItems}
          />
        )}
      </div>
    </div>
  )
}
