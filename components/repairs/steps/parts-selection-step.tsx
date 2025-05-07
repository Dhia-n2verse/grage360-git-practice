"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useRepairFormContext } from "../multi-step-repair-form"
import { getStockItems, type StockItem } from "@/lib/api/inventory"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PartsSelectionStep() {
  const { toast } = useToast()
  const { repairItems, setRepairItems, setTotalPartsCost } = useRepairFormContext()
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([])
  const [selectedItem, setSelectedItem] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [addingItem, setAddingItem] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  useEffect(() => {
    const fetchStockItems = async () => {
      setLoading(true)
      try {
        const { data } = await getStockItems(1, 100)
        // Only show items with quantity > 0
        const availableItems = data.filter((item) => item.quantity > 0)
        setStockItems(availableItems)
        setFilteredItems(availableItems)
      } catch (error) {
        console.error("Error fetching stock items:", error)
        toast({
          title: "Error",
          description: "Failed to load inventory items",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStockItems()
  }, [toast])

  useEffect(() => {
    let filtered = stockItems

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.part_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredItems(filtered)
  }, [searchTerm, stockItems, categoryFilter])

  // Calculate total parts cost whenever repair items change
  useEffect(() => {
    const total = repairItems.reduce((sum, item) => sum + item.total_price, 0)
    setTotalPartsCost(total)
  }, [repairItems, setTotalPartsCost])

  const handleAddItem = () => {
    if (!selectedItem) {
      toast({
        title: "Error",
        description: "Please select a part",
        variant: "destructive",
      })
      return
    }

    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than zero",
        variant: "destructive",
      })
      return
    }

    setAddingItem(true)
    try {
      const stockItem = stockItems.find((item) => item.id === selectedItem)
      if (!stockItem) {
        throw new Error("Selected stock item not found")
      }

      // Check if quantity is available
      if (stockItem.quantity < quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${stockItem.quantity} units available`,
          variant: "destructive",
        })
        return
      }

      // Check if item is already in the list and update quantity instead
      const existingItemIndex = repairItems.findIndex((item) => item.stock_item_id === selectedItem)
      if (existingItemIndex >= 0) {
        const updatedItems = [...repairItems]
        const newQuantity = updatedItems[existingItemIndex].quantity + quantity

        // Check if new total quantity exceeds available stock
        if (newQuantity > stockItem.quantity) {
          toast({
            title: "Insufficient Stock",
            description: `Cannot add ${quantity} more units. Only ${stockItem.quantity - updatedItems[existingItemIndex].quantity} additional units available`,
            variant: "destructive",
          })
          return
        }

        updatedItems[existingItemIndex].quantity = newQuantity
        updatedItems[existingItemIndex].total_price = newQuantity * updatedItems[existingItemIndex].unit_price
        setRepairItems(updatedItems)

        toast({
          title: "Part Updated",
          description: `Updated quantity of ${stockItem.name} to ${newQuantity}`,
        })
      } else {
        // Add new item
        const newItem = {
          stock_item_id: selectedItem,
          quantity: quantity,
          unit_price: stockItem.unit_selling_price || 0,
          total_price: (stockItem.unit_selling_price || 0) * quantity,
          stock_item: {
            name: stockItem.name,
            part_reference: stockItem.part_reference,
            category: stockItem.category,
          },
        }

        setRepairItems([...repairItems, newItem])

        toast({
          title: "Part Added",
          description: `Added ${quantity} ${stockItem.name} to repair`,
        })
      }

      // Reset selection
      setSelectedItem("")
      setQuantity(1)
    } catch (error) {
      console.error("Error adding part:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add part",
        variant: "destructive",
      })
    } finally {
      setAddingItem(false)
    }
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...repairItems]
    updatedItems.splice(index, 1)
    setRepairItems(updatedItems)

    toast({
      title: "Part Removed",
      description: "Part removed from repair",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  // Get unique categories for filter
  const categories = Array.from(new Set(stockItems.map((item) => item.category).filter(Boolean))) as string[]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="space-y-2 flex-1">
          <Label htmlFor="search">Search Parts</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name or part number..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 w-full md:w-[200px]">
          <Label htmlFor="category">Filter by Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="part">Select Part</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder="Select a part" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Parts</SelectLabel>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : filteredItems.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No parts found
                    </SelectItem>
                  ) : (
                    filteredItems.map((item) => (
                      <SelectItem key={item.id} value={item.id || ""}>
                        {item.name} - {formatCurrency(item.unit_selling_price || 0)} ({item.quantity} in stock)
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex items-center gap-2">
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
              />
              <Button type="button" onClick={handleAddItem} disabled={addingItem || !selectedItem || loading}>
                {addingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {repairItems.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.stock_item?.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell>{formatCurrency(item.total_price)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="font-bold text-right">
                    Total Parts Cost:
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatCurrency(repairItems.reduce((sum, item) => sum + item.total_price, 0))}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-8 border rounded-md">
            <p className="text-muted-foreground">No parts added yet</p>
          </div>
        )}

        {stockItems.some((item) => item.quantity < (item.minimum_quantity_to_order || 5)) && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Low Stock Warning</AlertTitle>
            <AlertDescription>
              Some items in your inventory are running low. Consider ordering more stock soon.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
