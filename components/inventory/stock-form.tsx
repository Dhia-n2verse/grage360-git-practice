"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  createStockItem,
  updateStockItem,
  getStockItemById,
  getSuppliers,
  type StockItem,
  type ProductCategory,
  type Supplier,
} from "@/lib/api/inventory"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  part_reference: z.string().optional(),
  quantity: z.coerce.number().int().min(0, "Quantity must be a positive number"),
  unit_selling_price: z.coerce.number().min(0, "Selling price must be a positive number").optional(),
  unit_purchase_price: z.coerce.number().min(0, "Purchase price must be a positive number").optional(),
  product_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  product_description: z.string().optional(),
  category: z.string().optional(),
  minimum_quantity_to_order: z.coerce.number().int().min(0, "Minimum quantity must be a positive number").optional(),
  supplier_id: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface StockFormProps {
  id?: string
}

export function StockForm({ id }: StockFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [initialData, setInitialData] = useState<StockItem | null>(null)

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      part_reference: "",
      quantity: 0,
      unit_selling_price: undefined,
      unit_purchase_price: undefined,
      product_link: "",
      product_description: "",
      category: undefined,
      minimum_quantity_to_order: 5,
      supplier_id: undefined,
    },
  })

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data } = await getSuppliers(1, 100)
        setSuppliers(data)
      } catch (error) {
        console.error("Failed to fetch suppliers:", error)
      }
    }

    fetchSuppliers()

    if (id) {
      const fetchStockItem = async () => {
        setLoading(true)
        try {
          const data = await getStockItemById(id)
          if (data) {
            setInitialData(data)
            form.reset({
              name: data.name,
              part_reference: data.part_reference || "",
              quantity: data.quantity,
              unit_selling_price: data.unit_selling_price,
              unit_purchase_price: data.unit_purchase_price,
              product_link: data.product_link || "",
              product_description: data.product_description || "",
              category: data.category,
              minimum_quantity_to_order: data.minimum_quantity_to_order,
              supplier_id: data.supplier_id,
            })
          }
        } catch (error) {
          console.error("Failed to fetch stock item:", error)
          toast({
            title: "Error",
            description: "Failed to load stock item data",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }

      fetchStockItem()
    }
  }, [id, form, toast])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      let result
      if (id) {
        result = await updateStockItem(id, values as StockItem)
      } else {
        result = await createStockItem(values as StockItem)
      }

      if (result.success) {
        toast({
          title: "Success",
          description: id ? "Stock item updated successfully" : "Stock item created successfully",
        })
        router.push("/inventory/stock")
      } else {
        throw new Error(result.error || "An error occurred")
      }
    } catch (error) {
      console.error("Failed to save stock item:", error)
      toast({
        title: "Error",
        description: "Failed to save stock item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">{id ? "Edit Stock Item" : "Add New Stock Item"}</h2>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Enter the details of the stock item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" placeholder="Enter product name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="part_reference">Part Reference</Label>
                <Input id="part_reference" placeholder="Enter part reference" {...form.register("part_reference")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  onValueChange={(value) => form.setValue("category", value)}
                  defaultValue={form.getValues("category")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Categories</SelectLabel>
                      {productCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  placeholder="Enter quantity"
                  {...form.register("quantity")}
                />
                {form.formState.errors.quantity && (
                  <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_quantity_to_order">Minimum Quantity to Order</Label>
                <Input
                  id="minimum_quantity_to_order"
                  type="number"
                  min="0"
                  placeholder="Enter minimum quantity"
                  {...form.register("minimum_quantity_to_order")}
                />
                {form.formState.errors.minimum_quantity_to_order && (
                  <p className="text-sm text-red-500">{form.formState.errors.minimum_quantity_to_order.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier</Label>
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_selling_price">Unit Selling Price</Label>
                <Input
                  id="unit_selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter selling price"
                  {...form.register("unit_selling_price")}
                />
                {form.formState.errors.unit_selling_price && (
                  <p className="text-sm text-red-500">{form.formState.errors.unit_selling_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_purchase_price">Unit Purchase Price</Label>
                <Input
                  id="unit_purchase_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter purchase price"
                  {...form.register("unit_purchase_price")}
                />
                {form.formState.errors.unit_purchase_price && (
                  <p className="text-sm text-red-500">{form.formState.errors.unit_purchase_price.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_link">Product Link</Label>
              <Input id="product_link" placeholder="Enter product URL" {...form.register("product_link")} />
              {form.formState.errors.product_link && (
                <p className="text-sm text-red-500">{form.formState.errors.product_link.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_description">Product Description</Label>
              <Textarea
                id="product_description"
                placeholder="Enter product description"
                rows={4}
                {...form.register("product_description")}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {id ? "Update" : "Save"}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
