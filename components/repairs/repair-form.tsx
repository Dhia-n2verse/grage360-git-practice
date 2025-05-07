"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { ArrowLeft, Plus, Save, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  createRepair,
  getRepairById,
  getApprovedDiagnostics,
  addRepairItem,
  deleteRepairItem,
  calculateRepairTotalCost,
  type Repair,
  type RepairItem,
} from "@/lib/api/repairs"
import { getVehicles } from "@/lib/api/vehicles"
import { getCustomers } from "@/lib/api/customers"
import { getStockItems } from "@/lib/api/inventory"
import { getTechniciansWithSpecialties } from "@/lib/api/technicians"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const formSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle is required"),
  customer_id: z.string().min(1, "Customer is required"),
  diagnostics_id: z.string().optional(),
  technician_specialty_id: z.string().optional(),
  progress: z.coerce
    .number()
    .int()
    .min(0, "Progress must be a positive number")
    .max(100, "Progress cannot exceed 100%"),
  status: z.enum(["Scheduled", "InProgress", "Pending", "Completed", "Cancelled"]),
  description: z.string().optional(),
  notes: z.string().optional(),
  labor_cost: z.coerce.number().min(0, "Labor cost must be a positive number"),
  total_cost: z.coerce.number().min(0, "Total cost must be a positive number").optional(),
  notify_customer: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface RepairFormProps {
  id?: string
}

export function RepairForm({ id }: RepairFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState<Repair | null>(null)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])
  const [selectedStockItem, setSelectedStockItem] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [repairItems, setRepairItems] = useState<RepairItem[]>([])
  const [totalCost, setTotalCost] = useState<number>(0)
  const [loadingItems, setLoadingItems] = useState(false)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)

  // Check if Supabase is properly initialized
  useEffect(() => {
    // Import dynamically to avoid SSR issues
    import("@/lib/supabase").then(({ isSupabaseInitialized }) => {
      if (!isSupabaseInitialized()) {
        setSupabaseError("Supabase is not properly initialized. Check your environment variables.")
        toast({
          title: "Configuration Error",
          description: "Database connection is not properly configured. Please check your environment variables.",
          variant: "destructive",
        })
      }
    })
  }, [toast])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicle_id: "",
      customer_id: "",
      diagnostics_id: "",
      technician_specialty_id: "",
      progress: 0,
      status: "Scheduled",
      description: "",
      notes: "",
      labor_cost: 0,
      total_cost: 0,
      notify_customer: false,
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vehicles
        const vehiclesData = await getVehicles(1, 100)
        setVehicles(vehiclesData.data || [])

        // Fetch customers
        const customersData = await getCustomers(1, 100)
        setCustomers(customersData.data || [])

        // Fetch approved diagnostics
        const diagnosticsData = await getApprovedDiagnostics()
        setDiagnostics(diagnosticsData || [])

        // Fetch technicians with specialties
        const techniciansData = await getTechniciansWithSpecialties()
        setTechnicians(techniciansData.data || [])

        // Fetch stock items
        const stockData = await getStockItems(1, 100)
        setStockItems(stockData.data || [])
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }

    fetchData()

    // Fix: Only fetch repair if id exists and is not "new"
    if (id && id !== "new") {
      const fetchRepair = async () => {
        setLoading(true)
        try {
          const data = await getRepairById(id)
          if (data) {
            setInitialData(data)
            form.reset({
              vehicle_id: data.vehicle_id,
              customer_id: data.customer_id,
              diagnostics_id: data.diagnostics_id || "",
              technician_specialty_id: data.technician_specialty_id || "",
              progress: data.progress,
              status: data.status,
              description: data.description || "",
              notes: data.notes || "",
              labor_cost: data.labor_cost,
              total_cost: data.total_cost || 0,
              notify_customer: data.notify_customer,
            })
            setRepairItems(data.repair_items || [])
            setTotalCost(data.total_cost || 0)
          }
        } catch (error) {
          console.error("Failed to fetch repair:", error)
          toast({
            title: "Error",
            description: "Failed to load repair data",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }

      fetchRepair()
    }
  }, [id, form, toast])

  useEffect(() => {
    // Update total cost whenever repair items or labor cost changes
    const laborCost = form.getValues("labor_cost") || 0
    const newTotalCost = calculateRepairTotalCost(laborCost, repairItems)
    setTotalCost(newTotalCost)
  }, [repairItems, form])

  // Enhance the onSubmit function with better error handling
  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true)

      // Calculate the total cost before submission
      const partsCost = repairItems.reduce((total, item) => total + item.total_price, 0)
      const totalCost = (data.labor_cost || 0) + partsCost

      // Include the calculated total cost and repair items in the submission
      const repairData = {
        ...data,
        total_cost: totalCost,
        repair_items: repairItems,
      }

      console.log("Submitting repair data:", JSON.stringify(repairData, null, 2))

      const response = await createRepair(repairData)

      // Fix the router.push path to match the correct route structure
      if (response?.success) {
        toast({
          title: "Success",
          description: "Repair created successfully",
        })
        // Update the path to match your application's route structure
        router.push(`/garage/repairs/${response.id}`)
      } else {
        console.error("Failed to create repair:", response?.error, response?.details)
        toast({
          title: "Error",
          description: response?.error || "Failed to create repair. Please check the console for details.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Exception in repair submission:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast({
        title: "Error",
        description: `An error occurred while creating the repair: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVehicleChange = (vehicleId: string) => {
    form.setValue("vehicle_id", vehicleId)

    // Find the vehicle and set the customer if available
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    if (vehicle && vehicle.customer_id) {
      form.setValue("customer_id", vehicle.customer_id)
    }
  }

  const handleCustomerChange = (customerId: string) => {
    form.setValue("customer_id", customerId)

    // If vehicle is not set, filter vehicles by customer
    if (!form.getValues("vehicle_id")) {
      // You could optionally auto-select a vehicle here if the customer only has one
    }
  }

  const handleAddRepairItem = async () => {
    if (!selectedStockItem || quantity <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a part and enter a valid quantity",
        variant: "destructive",
      })
      return
    }

    setLoadingItems(true)
    try {
      const stockItem = stockItems.find((item) => item.id === selectedStockItem)
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

      const newItem: RepairItem = {
        stock_item_id: selectedStockItem,
        quantity: quantity,
        unit_price: stockItem.unit_selling_price || 0,
        total_price: (stockItem.unit_selling_price || 0) * quantity,
        // Fix issue #2: Don't include stock_item object when creating a new repair item
        // We'll add it manually for the UI only
      }

      // If editing an existing repair, add the item to the database
      if (id && id !== "new") {
        try {
          const result = await addRepairItem({
            ...newItem,
            repair_id: id,
          })

          if (result.success) {
            newItem.id = result.id
          } else {
            // Fix issue #3: Improve error message
            throw new Error(result.error || "Failed to add repair item")
          }
        } catch (error) {
          // Fix issue #3: Better error handling
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
          toast({
            title: "Error",
            description: `Failed to add part: ${errorMessage}`,
            variant: "destructive",
          })
          setLoadingItems(false)
          return
        }
      }

      // Add stock_item info for UI display only
      const itemForUI = {
        ...newItem,
        stock_item: {
          name: stockItem.name,
          part_reference: stockItem.part_reference,
          category: stockItem.category,
        },
      }

      // Add to local state
      setRepairItems([...repairItems, itemForUI])

      // Reset form
      setSelectedStockItem("")
      setQuantity(1)

      // Fix issue #4: Update total cost calculation
      const newPartsCost = repairItems.reduce((total, item) => total + item.total_price, 0) + newItem.total_price
      const laborCost = form.getValues("labor_cost") || 0
      const newTotalCost = laborCost + newPartsCost
      setTotalCost(newTotalCost)

      toast({
        title: "Part Added",
        description: `${stockItem.name} added to repair`,
      })
    } catch (error) {
      console.error("Failed to add repair item:", error)
      // Fix issue #3: Better error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast({
        title: "Error",
        description: `Failed to add part: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoadingItems(false)
    }
  }

  const handleRemoveRepairItem = async (index: number) => {
    setLoadingItems(true)
    try {
      const itemToRemove = repairItems[index]

      // If editing an existing repair, delete from database
      if (id && id !== "new" && itemToRemove.id) {
        try {
          const result = await deleteRepairItem(itemToRemove.id)
          if (!result.success) {
            // Fix issue #3: Better error message
            throw new Error(result.error || "Failed to remove repair item")
          }
        } catch (error) {
          // Fix issue #3: Better error handling
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
          toast({
            title: "Error",
            description: `Failed to remove part: ${errorMessage}`,
            variant: "destructive",
          })
          setLoadingItems(false)
          return
        }
      }

      // Remove from local state
      const updatedItems = [...repairItems]
      updatedItems.splice(index, 1)
      setRepairItems(updatedItems)

      // Fix issue #4: Update total cost calculation
      const newPartsCost = updatedItems.reduce((total, item) => total + item.total_price, 0)
      const laborCost = form.getValues("labor_cost") || 0
      const newTotalCost = laborCost + newPartsCost
      setTotalCost(newTotalCost)

      toast({
        title: "Part Removed",
        description: "Part removed from repair",
      })
    } catch (error) {
      console.error("Failed to remove repair item:", error)
      // Fix issue #3: Better error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast({
        title: "Error",
        description: `Failed to remove part: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoadingItems(false)
    }
  }

  const formatCurrency = (value: number) => {
    // Ensure we're working with a number and round to 2 decimal places
    const roundedValue = Math.round(value * 100) / 100
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(roundedValue)
  }

  return (
    <div className="space-y-4">
      {supabaseError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
          <h3 className="font-semibold">Configuration Error</h3>
          <p>{supabaseError}</p>
          <p className="text-sm mt-2">
            Please ensure your Supabase environment variables are correctly set in the v0.dev environment.
          </p>
        </div>
      )}

      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">{id ? "Edit Repair" : "New Repair"}</h2>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Repair Information</CardTitle>
                <CardDescription>Enter the details of the repair</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_id">Vehicle *</Label>
                    <Select onValueChange={handleVehicleChange} defaultValue={form.getValues("vehicle_id")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Vehicles</SelectLabel>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.make} {vehicle.model} ({vehicle.license_plate || "No plate"})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.vehicle_id && (
                      <p className="text-sm text-red-500">{form.formState.errors.vehicle_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer_id">Customer *</Label>
                    <Select onValueChange={handleCustomerChange} defaultValue={form.getValues("customer_id")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Customers</SelectLabel>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.first_name} {customer.last_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.customer_id && (
                      <p className="text-sm text-red-500">{form.formState.errors.customer_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnostics_id">Related Diagnostic</Label>
                    <Select
                      onValueChange={(value) => form.setValue("diagnostics_id", value === "none" ? "" : value)}
                      defaultValue={form.getValues("diagnostics_id") || "none"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a diagnostic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Approved Diagnostics</SelectLabel>
                          <SelectItem value="none">None</SelectItem>
                          {diagnostics.map((diagnostic) => (
                            <SelectItem key={diagnostic.id} value={diagnostic.id}>
                              {diagnostic.vehicle?.make} {diagnostic.vehicle?.model} -{" "}
                              {diagnostic.vehicle?.license_plate}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="technician_specialty_id">Technician</Label>
                    <Select
                      onValueChange={(value) => form.setValue("technician_specialty_id", value)}
                      defaultValue={form.getValues("technician_specialty_id")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a technician" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Technicians</SelectLabel>
                          {technicians.map((technician) => (
                            <SelectItem key={technician.id} value={technician.id}>
                              {technician.full_name} ({technician.specialties.map((s: any) => s.name).join(", ")})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      onValueChange={(value) => form.setValue("status", value as any)}
                      defaultValue={form.getValues("status")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="InProgress">In Progress</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.status && (
                      <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="progress">Progress (%) *</Label>
                    <Input
                      id="progress"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Enter progress percentage"
                      {...form.register("progress")}
                    />
                    {form.formState.errors.progress && (
                      <p className="text-sm text-red-500">{form.formState.errors.progress.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="labor_cost">Labor Cost *</Label>
                    <Input
                      id="labor_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter labor cost"
                      {...form.register("labor_cost")}
                      onChange={(e) => {
                        form.setValue("labor_cost", Number.parseFloat(e.target.value) || 0)
                        // Update total cost
                        const newLaborCost = Number.parseFloat(e.target.value) || 0
                        const newTotalCost = calculateRepairTotalCost(newLaborCost, repairItems)
                        setTotalCost(newTotalCost)
                      }}
                    />
                    {form.formState.errors.labor_cost && (
                      <p className="text-sm text-red-500">{form.formState.errors.labor_cost.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter repair description"
                    rows={3}
                    {...form.register("description")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Enter additional notes" rows={3} {...form.register("notes")} />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notify_customer"
                    {...form.register("notify_customer")}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="notify_customer">Notify customer when repair is completed</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parts & Materials</CardTitle>
                <CardDescription>Add parts and materials used in the repair</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="stock_item">Part</Label>
                    <Select onValueChange={setSelectedStockItem} value={selectedStockItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a part" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Parts</SelectLabel>
                          {stockItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {formatCurrency(item.unit_selling_price || 0)} ({item.quantity} in stock)
                            </SelectItem>
                          ))}
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
                      <Button type="button" onClick={handleAddRepairItem} disabled={loadingItems || !selectedStockItem}>
                        {loadingItems ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

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
                      {repairItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            No parts added yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        repairItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.stock_item?.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell>{formatCurrency(item.total_price)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveRepairItem(index)}
                                disabled={loadingItems}
                              >
                                {loadingItems ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>Repair cost summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Labor Cost:</span>
                    <span>{formatCurrency(form.getValues("labor_cost") || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parts Cost:</span>
                    <span>{formatCurrency(repairItems.reduce((total, item) => total + item.total_price, 0))}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total Cost:</span>
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {id ? "Update Repair" : "Create Repair"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Current repair status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Badge
                      className={`w-full justify-center py-1 ${
                        form.getValues("status") === "Completed"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : form.getValues("status") === "InProgress"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : form.getValues("status") === "Scheduled"
                              ? "bg-purple-100 text-purple-800 border-purple-300"
                              : form.getValues("status") === "Pending"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                : "bg-red-100 text-red-800 border-red-300"
                      }`}
                    >
                      {form.getValues("status")}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Progress: {form.getValues("progress")}%</span>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${form.getValues("progress")}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
