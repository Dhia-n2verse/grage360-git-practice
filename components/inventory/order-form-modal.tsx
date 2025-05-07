"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createStockOrder, getSuppliers, type StockItem, type Supplier, type StockOrder } from "@/lib/api/inventory"

const formSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().min(0.01, "Unit price must be greater than 0"),
  order_status: z.enum(["Pending", "Shipped"]),
  supplier_id: z.string().min(1, "Supplier is required"),
})

type FormValues = z.infer<typeof formSchema>

interface OrderFormModalProps {
  stockItem: StockItem | null
  isOpen: boolean
  onClose: () => void
  onOrderComplete: () => void
}

export function OrderFormModal({ stockItem, isOpen, onClose, onOrderComplete }: OrderFormModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [totalPrice, setTotalPrice] = useState(0)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      unit_price: stockItem?.unit_purchase_price || 0,
      order_status: "Pending",
      supplier_id: stockItem?.supplier_id || "",
    },
  })

  // Watch for changes to calculate total price
  const quantity = form.watch("quantity")
  const unitPrice = form.watch("unit_price")

  useEffect(() => {
    // Calculate total price
    setTotalPrice(quantity * unitPrice)
  }, [quantity, unitPrice])

  useEffect(() => {
    // Reset form when stock item changes
    if (stockItem) {
      form.reset({
        quantity: 1,
        unit_price: stockItem.unit_purchase_price || 0,
        order_status: "Pending",
        supplier_id: stockItem.supplier_id || "",
      })
    }
  }, [stockItem, form])

  useEffect(() => {
    // Fetch suppliers
    const fetchSuppliers = async () => {
      try {
        const { data } = await getSuppliers(1, 100)
        setSuppliers(data)
      } catch (error) {
        console.error("Failed to fetch suppliers:", error)
      }
    }

    if (isOpen) {
      fetchSuppliers()
    }
  }, [isOpen])

  const onSubmit = async (values: FormValues) => {
    if (!stockItem?.id) return

    setLoading(true)
    try {
      // Create order object
      const order: StockOrder = {
        stock_id: stockItem.id,
        quantity: values.quantity,
        unit_price: values.unit_price,
        total_price: totalPrice,
        order_status: values.order_status,
      }

      // Submit order
      const result = await createStockOrder(order)

      if (result.success) {
        toast({
          title: "Success",
          description: "Order created successfully",
        })
        onOrderComplete()
        onClose()
      } else {
        throw new Error(result.error || "An error occurred")
      }
    } catch (error) {
      console.error("Failed to create order:", error)
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Order Parts</DialogTitle>
          <DialogDescription>
            Create a new order for {stockItem?.name} ({stockItem?.part_reference || "No reference"})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="part-name" className="text-right">
                Part
              </Label>
              <Input id="part-name" value={stockItem?.name || ""} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-stock" className="text-right">
                Current Stock
              </Label>
              <Input id="current-stock" value={stockItem?.quantity || 0} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity *
              </Label>
              <Input id="quantity" type="number" min="1" className="col-span-3" {...form.register("quantity")} />
              {form.formState.errors.quantity && (
                <p className="text-sm text-red-500 col-start-2 col-span-3">{form.formState.errors.quantity.message}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit-price" className="text-right">
                Unit Price *
              </Label>
              <Input
                id="unit-price"
                type="number"
                step="0.01"
                min="0.01"
                className="col-span-3"
                {...form.register("unit_price")}
              />
              {form.formState.errors.unit_price && (
                <p className="text-sm text-red-500 col-start-2 col-span-3">
                  {form.formState.errors.unit_price.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total-price" className="text-right">
                Total Price
              </Label>
              <Input id="total-price" value={formatCurrency(totalPrice)} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier" className="text-right">
                Supplier *
              </Label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) => form.setValue("supplier_id", value)}
                  defaultValue={form.getValues("supplier_id")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Suppliers</SelectLabel>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id || ""}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {form.formState.errors.supplier_id && (
                  <p className="text-sm text-red-500">{form.formState.errors.supplier_id.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Order Status *
              </Label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) => form.setValue("order_status", value as "Pending" | "Shipped")}
                  defaultValue={form.getValues("order_status")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.order_status && (
                  <p className="text-sm text-red-500">{form.formState.errors.order_status.message}</p>
                )}
              </div>
            </div>
            <div className="col-span-full">
              <p className="text-sm text-muted-foreground">
                Note: If order status is set to "Shipped", the stock quantity will be automatically updated.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Create Order"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
