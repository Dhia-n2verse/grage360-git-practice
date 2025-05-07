"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ChevronDown, Car, Truck, BikeIcon as Motorcycle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { createVehicle, type Vehicle } from "@/lib/api/vehicles"
import { supabase } from "@/lib/supabase"
import { getVehicleMakeLogo } from "@/lib/api/vehicle-logos"

// Define schema for form validation
const vehicleSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  vin: z.string().optional(),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  model_year: z.coerce
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  license_plate: z.string().optional(),
  vehicle_type: z.enum(["Luxury", "Commercial", "Basic"]).optional(),
  vehicle_category: z.enum(["SUV", "Sedan", "Truck", "Van", "Motorcycle", "Other"]).optional(),
  engine_type: z.enum(["Internal Combustion Engine", "Electric Motor", "Hybrid Engine"]).optional(),
  fuel_type: z.enum(["Gasoline", "Diesel", "Electricity", "Petrol + Electricity"]).optional(),
  transmission_type: z.enum(["Manual", "Automatic", "CVT"]).optional(),
  mileage: z.coerce.number().min(0).optional(),
  mileage_unit: z.enum(["km", "miles"]).optional(),
  logo_image: z.string().optional().nullable(),
})

type VehicleFormValues = z.infer<typeof vehicleSchema> & {
  logo_image?: string | null
}

interface CustomerOption {
  id: string
  label: string
  email: string
  phone: string
}

interface VehicleRegistrationFormProps {
  onVehicleRegistered: (vehicle: any) => void
  canWrite: boolean
  preselectedCustomerId?: string
}

export function VehicleRegistrationForm({
  onVehicleRegistered,
  canWrite,
  preselectedCustomerId,
}: VehicleRegistrationFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDetailedView, setIsDetailedView] = useState(false)
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [openCustomerSelect, setOpenCustomerSelect] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null)

  // Initialize form with default values
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      customer_id: preselectedCustomerId || "",
      vin: "",
      make: "",
      model: "",
      model_year: undefined,
      license_plate: "",
      vehicle_type: undefined,
      vehicle_category: undefined,
      engine_type: undefined,
      fuel_type: undefined,
      transmission_type: undefined,
      mileage: undefined,
      mileage_unit: "km",
      logo_image: null,
    },
  })

  // Fetch customers for the dropdown
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, first_name, last_name, email, phone")
          .eq("status", "active")
          .order("first_name", { ascending: true })

        if (error) throw error

        const formattedCustomers = data.map((customer) => ({
          id: customer.id,
          label: `${customer.first_name} ${customer.last_name}`,
          email: customer.email,
          phone: customer.phone,
        }))

        setCustomers(formattedCustomers)

        // If preselectedCustomerId is provided, set the selected customer
        if (preselectedCustomerId) {
          const preselectedCustomer = formattedCustomers.find((c) => c.id === preselectedCustomerId)
          if (preselectedCustomer) {
            setSelectedCustomer(preselectedCustomer)
          }
        }
      } catch (err) {
        console.error("Error fetching customers:", err)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load customers. Please try again.",
        })
      }
    }

    fetchCustomers()
  }, [preselectedCustomerId, toast])

  const handleMakeChange = async (make: string) => {
    if (!make) return

    try {
      const logoUrl = await getVehicleMakeLogo(make)
      if (logoUrl) {
        // Set the logo_image field
        form.setValue("logo_image", logoUrl)
      }
    } catch (error) {
      console.error("Error fetching make logo:", error)
    }
  }

  // Handle form submission
  const onSubmit = async (data: VehicleFormValues) => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to register vehicles.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create vehicle record
      const { data: vehicleData, error } = await createVehicle(data as Vehicle)

      if (error) throw error

      // Notify parent component
      onVehicleRegistered(vehicleData)

      // Reset form
      form.reset({
        customer_id: "",
        vin: "",
        make: "",
        model: "",
        model_year: undefined,
        license_plate: "",
        vehicle_type: undefined,
        vehicle_category: undefined,
        engine_type: undefined,
        fuel_type: undefined,
        transmission_type: undefined,
        mileage: undefined,
        mileage_unit: "km",
        logo_image: null,
      })
      setSelectedCustomer(null)

      toast({
        title: "Vehicle Registered",
        description: "The vehicle has been successfully registered.",
      })
    } catch (err: any) {
      console.error("Error registering vehicle:", err)
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: err.message || "Failed to register vehicle. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to get vehicle category icon
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "SUV":
      case "Sedan":
        return <Car className="h-8 w-8 text-muted-foreground" />
      case "Truck":
      case "Van":
        return <Truck className="h-8 w-8 text-muted-foreground" />
      case "Motorcycle":
        return <Motorcycle className="h-8 w-8 text-muted-foreground" />
      default:
        return <Car className="h-8 w-8 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Vehicle Registration Form</h2>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${!isDetailedView ? "text-primary" : "text-muted-foreground"}`}>Simple</span>
            <Switch checked={isDetailedView} onCheckedChange={setIsDetailedView} disabled={isSubmitting} />
            <span className={`text-sm ${isDetailedView ? "text-primary" : "text-muted-foreground"}`}>Detailed</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Vehicle Placeholder - Centered at the top */}
            <div className="flex flex-col items-center mb-8">
              <div className="h-32 w-32 flex items-center justify-center bg-muted rounded-md">
                {getCategoryIcon(form.getValues("vehicle_category"))}
              </div>
            </div>

            <div className="grid gap-6">
              {/* Customer Selection */}
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Customer</FormLabel>
                    <Popover open={openCustomerSelect} onOpenChange={setOpenCustomerSelect}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCustomerSelect}
                            className="justify-between w-full"
                            disabled={isSubmitting || !!preselectedCustomerId}
                          >
                            {selectedCustomer ? selectedCustomer.label : "Select customer..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search customers..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-auto">
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.label}
                                  onSelect={() => {
                                    form.setValue("customer_id", customer.id)
                                    setSelectedCustomer(customer)
                                    setOpenCustomerSelect(false)
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span>{customer.label}</span>
                                    <span className="text-xs text-muted-foreground">{customer.email}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedCustomer && (
                      <div className="text-sm text-muted-foreground mt-1">
                        <div>Email: {selectedCustomer.email}</div>
                        <div>Phone: {selectedCustomer.phone}</div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Basic Vehicle Information - Always visible */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Toyota, Honda"
                            {...field}
                            disabled={isSubmitting}
                            onChange={(e) => {
                              field.onChange(e)
                              handleMakeChange(e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Corolla, Civic" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="model_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 2022"
                            {...field}
                            disabled={isSubmitting}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value ? Number.parseInt(e.target.value) : undefined
                              field.onChange(value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="license_plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ABC123" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN (Vehicle Identification Number)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter VIN" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicle_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SUV">SUV</SelectItem>
                          <SelectItem value="Sedan">Sedan</SelectItem>
                          <SelectItem value="Truck">Truck</SelectItem>
                          <SelectItem value="Van">Van</SelectItem>
                          <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Detailed Information - Only visible in detailed mode */}
              {isDetailedView && (
                <Collapsible defaultOpen={true} className="border rounded-md">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 font-medium">
                    <span>Additional Information</span>
                    <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 pt-0 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="vehicle_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Luxury">Luxury</SelectItem>
                                <SelectItem value="Commercial">Commercial</SelectItem>
                                <SelectItem value="Basic">Basic</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="engine_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Engine Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select engine type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Internal Combustion Engine">Internal Combustion Engine</SelectItem>
                                <SelectItem value="Electric Motor">Electric Motor</SelectItem>
                                <SelectItem value="Hybrid Engine">Hybrid Engine</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fuel_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuel Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select fuel type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Gasoline">Gasoline</SelectItem>
                                <SelectItem value="Diesel">Diesel</SelectItem>
                                <SelectItem value="Electricity">Electricity</SelectItem>
                                <SelectItem value="Petrol + Electricity">Petrol + Electricity</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="transmission_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transmission Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select transmission type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Manual">Manual</SelectItem>
                                <SelectItem value="Automatic">Automatic</SelectItem>
                                <SelectItem value="CVT">CVT</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="mileage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mileage</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 50000"
                                {...field}
                                disabled={isSubmitting}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value ? Number.parseInt(e.target.value) : undefined
                                  field.onChange(value)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mileage_unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mileage Unit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="km">Kilometers (km)</SelectItem>
                                <SelectItem value="miles">Miles</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Vehicle"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
