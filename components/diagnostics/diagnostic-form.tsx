"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2, Car, User } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  createDiagnostic,
  updateDiagnostic,
  SYSTEM_CHECKS,
  SEVERITY_LEVELS,
  type Diagnostic,
} from "@/lib/api/diagnostics"
import { supabase } from "@/lib/supabase"

// Define the form schema with Zod
const errorCodeSchema = z.object({
  code: z.string().min(1, "Error code is required"),
  related_system: z.enum(SYSTEM_CHECKS as unknown as [string, ...string[]]),
  severity: z.enum(SEVERITY_LEVELS as unknown as [string, ...string[]]),
  recommendation: z.string().optional(),
})

const diagnosticFormSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  system_checks: z.array(z.string()).min(1, "At least one system must be checked"),
  error_codes: z.array(errorCodeSchema),
  observation: z.string().optional(),
  recommendation: z.string().optional(),
})

type DiagnosticFormValues = z.infer<typeof diagnosticFormSchema>

interface DiagnosticFormProps {
  initialData?: Diagnostic
  onSuccess: (diagnostic: Diagnostic) => void
  canWrite: boolean
  preselectedCustomerId?: string
  preselectedVehicleId?: string
}

export function DiagnosticForm({
  initialData,
  onSuccess,
  canWrite,
  preselectedCustomerId,
  preselectedVehicleId,
}: DiagnosticFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("")

  // Initialize the form
  const form = useForm<DiagnosticFormValues>({
    resolver: zodResolver(diagnosticFormSchema),
    defaultValues: initialData
      ? {
          customer_id: initialData.customer_id,
          vehicle_id: initialData.vehicle_id,
          system_checks: initialData.system_checks,
          error_codes: initialData.error_codes,
          observation: initialData.observation || "",
          recommendation: initialData.recommendation || "",
        }
      : {
          customer_id: preselectedCustomerId || "",
          vehicle_id: preselectedVehicleId || "",
          system_checks: [],
          error_codes: [],
          observation: "",
          recommendation: "",
        },
  })

  // Set up field array for error codes
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "error_codes",
  })

  // Load customers and vehicles on component mount
  useEffect(() => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description:
          "You don't have permission to create or edit diagnostics. This action requires Manager, Technician, or Front Desk role.",
      })
      router.push("/garage/diagnostics")
      return
    }

    fetchCustomers()
    fetchVehicles()
  }, [canWrite])

  // Filter vehicles when customer changes
  useEffect(() => {
    const customerId = form.watch("customer_id")
    if (customerId) {
      const customerVehicles = vehicles.filter((vehicle) => vehicle.customer_id === customerId)
      setFilteredVehicles(customerVehicles)
    } else {
      setFilteredVehicles(vehicles)
    }
  }, [form.watch("customer_id"), vehicles])

  // Fetch customers from the database
  const fetchCustomers = async (searchTerm = "") => {
    setIsLoadingCustomers(true)
    try {
      let query = supabase.from("customers").select("*").eq("status", "active")

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error

      setCustomers(data || [])
    } catch (err: any) {
      console.error("Error fetching customers:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to load customers. Please try again.",
      })
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  // Fetch vehicles from the database
  const fetchVehicles = async (searchTerm = "") => {
    setIsLoadingVehicles(true)
    try {
      let query = supabase
        .from("vehicles")
        .select(
          `
          *,
          customer:customer_id (
            id,
            first_name,
            last_name,
            email
          )
        `,
        )
        .eq("status", "active")

      if (searchTerm) {
        query = query.or(`make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,license_plate.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error

      setVehicles(data || [])
      setFilteredVehicles(data || [])
    } catch (err: any) {
      console.error("Error fetching vehicles:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to load vehicles. Please try again.",
      })
    } finally {
      setIsLoadingVehicles(false)
    }
  }

  // Handle form submission
  const onSubmit = async (values: DiagnosticFormValues) => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description:
          "You don't have permission to create or edit diagnostics. This action requires Manager, Technician, or Front Desk role.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      let result

      if (initialData?.id) {
        // Update existing diagnostic
        result = await updateDiagnostic(initialData.id, values)
      } else {
        // Create new diagnostic
        result = await createDiagnostic(values)
      }

      if (result.error) throw result.error

      toast({
        title: initialData ? "Diagnostic Updated" : "Diagnostic Created",
        description: initialData
          ? "The diagnostic has been updated successfully."
          : "The diagnostic has been created successfully.",
      })

      if (result.data) {
        onSuccess(result.data)
      }
    } catch (err: any) {
      console.error("Error saving diagnostic:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to save diagnostic. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle "Select All Systems" checkbox
  const handleSelectAllSystems = (checked: boolean) => {
    if (checked) {
      form.setValue("system_checks", [...SYSTEM_CHECKS])
    } else {
      form.setValue("system_checks", [])
    }
  }

  // Check if all systems are selected
  const areAllSystemsSelected = () => {
    const selectedSystems = form.watch("system_checks")
    return selectedSystems.length === SYSTEM_CHECKS.length
  }

  // Handle customer search
  const handleCustomerSearch = () => {
    fetchCustomers(customerSearchTerm)
  }

  // Handle vehicle search
  const handleVehicleSearch = () => {
    fetchVehicles(vehicleSearchTerm)
  }

  // Add a new error code
  const addErrorCode = () => {
    append({
      code: "",
      related_system: "Engine",
      severity: "Low",
      recommendation: "",
    })
  }

  // Navigate to create customer page
  const handleCreateCustomer = () => {
    router.push("/garage/customers?tab=register")
  }

  // Navigate to create vehicle page
  const handleCreateVehicle = () => {
    const customerId = form.watch("customer_id")
    if (customerId) {
      router.push(`/garage/vehicles?tab=register&customer_id=${customerId}`)
    } else {
      router.push("/garage/vehicles?tab=register")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{initialData ? "Edit Diagnostic" : "Create Diagnostic"}</CardTitle>
            <CardDescription>
              {initialData ? "Update the diagnostic information below." : "Enter the diagnostic information below."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleCreateCustomer}>
                  <User className="mr-2 h-4 w-4" />
                  New Customer
                </Button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search customers..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomerSearch()}
                  />
                </div>
                <Button type="button" onClick={handleCustomerSearch} disabled={isLoadingCustomers}>
                  {isLoadingCustomers ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.first_name} {customer.last_name} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Vehicle Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Vehicle Information</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleCreateVehicle}>
                  <Car className="mr-2 h-4 w-4" />
                  New Vehicle
                </Button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search vehicles..."
                    value={vehicleSearchTerm}
                    onChange={(e) => setVehicleSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVehicleSearch()}
                  />
                </div>
                <Button type="button" onClick={handleVehicleSearch} disabled={isLoadingVehicles}>
                  {isLoadingVehicles ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} {vehicle.model_year && `(${vehicle.model_year})`}{" "}
                            {vehicle.license_plate && `- ${vehicle.license_plate}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* System Checks */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">System Checks</h3>

              <div className="flex items-center space-x-2 mb-4">
                <Checkbox id="select-all" checked={areAllSystemsSelected()} onCheckedChange={handleSelectAllSystems} />
                <Label htmlFor="select-all">Select All Systems</Label>
              </div>

              <FormField
                control={form.control}
                name="system_checks"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {SYSTEM_CHECKS.map((system) => (
                        <FormField
                          key={system}
                          control={form.control}
                          name="system_checks"
                          render={({ field }) => {
                            return (
                              <FormItem key={system} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(system)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, system])
                                        : field.onChange(field.value?.filter((value) => value !== system))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{system}</FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Error Codes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Error Codes</h3>
                <Button type="button" variant="outline" size="sm" onClick={addErrorCode}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Error Code
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No error codes added. Click "Add Error Code" to add one.
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-md p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Error Code {index + 1}</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`error_codes.${index}.code`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Error Code</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. P0300" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`error_codes.${index}.related_system`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Related System</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a system" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {SYSTEM_CHECKS.map((system) => (
                                    <SelectItem key={system} value={system}>
                                      {system}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`error_codes.${index}.severity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Severity</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SEVERITY_LEVELS.map((level) => (
                                  <SelectItem key={level} value={level}>
                                    {level}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`error_codes.${index}.recommendation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recommendation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Recommendation for this error code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Observations & Recommendations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Observations & Recommendations</h3>

              <FormField
                control={form.control}
                name="observation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter your observations here" className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommendations</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter your recommendations here" className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/garage/diagnostics")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{initialData ? "Update" : "Create"} Diagnostic</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
