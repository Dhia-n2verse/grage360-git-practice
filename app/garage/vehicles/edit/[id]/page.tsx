"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/context/auth-context"
import { supabase } from "@/lib/supabase"
import { getVehicleById, updateVehicle } from "@/lib/api/vehicles"

// Form schema for vehicle data
const vehicleFormSchema = z.object({
  customer_id: z.string().min(1, { message: "Customer is required." }),
  make: z.string().min(1, { message: "Make is required." }),
  model: z.string().min(1, { message: "Model is required." }),
  model_year: z.coerce.number().optional(),
  license_plate: z.string().optional(),
  vin: z.string().optional(),
  vehicle_type: z.string().optional(),
  vehicle_category: z.string().optional(),
  engine_type: z.string().optional(),
  fuel_type: z.string().optional(),
  transmission_type: z.string().optional(),
  mileage: z.coerce.number().optional(),
  mileage_unit: z.string().optional(),
})

type VehicleFormValues = z.infer<typeof vehicleFormSchema>

export default function EditVehiclePage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<any[]>([])

  // Check user permissions
  const canWrite = user?.role === "Manager" || user?.role === "Front Desk"

  // Initialize form
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      customer_id: "",
      make: "",
      model: "",
      model_year: undefined,
      license_plate: "",
      vin: "",
      vehicle_type: "",
      vehicle_category: "",
      engine_type: "",
      fuel_type: "",
      transmission_type: "",
      mileage: undefined,
      mileage_unit: "km",
    },
  })

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, first_name, last_name, email")
          .eq("status", "active")
          .order("first_name", { ascending: true })

        if (error) throw error

        setCustomers(data || [])
      } catch (err) {
        console.error("Error fetching customers:", err)
      }
    }

    fetchCustomers()
  }, [])

  // Fetch vehicle data
  useEffect(() => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to edit vehicles.",
      })
      router.push("/garage/vehicles")
      return
    }

    const fetchVehicle = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await getVehicleById(id as string)

        if (error) throw error

        if (data) {
          // Set form values
          form.reset({
            customer_id: data.customer_id || "",
            make: data.make || "",
            model: data.model || "",
            model_year: data.model_year,
            license_plate: data.license_plate || "",
            vin: data.vin || "",
            vehicle_type: data.vehicle_type || "",
            vehicle_category: data.vehicle_category || "",
            engine_type: data.engine_type || "",
            fuel_type: data.fuel_type || "",
            transmission_type: data.transmission_type || "",
            mileage: data.mileage,
            mileage_unit: data.mileage_unit || "km",
          })
        }
      } catch (err: any) {
        console.error("Error fetching vehicle:", err)
        setError(err.message || "Failed to load vehicle data")
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load vehicle data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVehicle()
  }, [id, canWrite, router, toast, form])

  // Handle form submission
  const onSubmit = async (data: VehicleFormValues) => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to edit vehicles.",
      })
      return
    }

    setIsSaving(true)
    try {
      const { data: updatedVehicle, error } = await updateVehicle(id as string, {
        customer_id: data.customer_id,
        make: data.make,
        model: data.model,
        model_year: data.model_year,
        license_plate: data.license_plate,
        vin: data.vin,
        vehicle_type: data.vehicle_type,
        vehicle_category: data.vehicle_category,
        engine_type: data.engine_type,
        fuel_type: data.fuel_type,
        transmission_type: data.transmission_type,
        mileage: data.mileage,
        mileage_unit: data.mileage_unit,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Vehicle Updated",
        description: "The vehicle has been successfully updated.",
      })

      // Navigate back to vehicle list
      router.push("/garage/vehicles")
    } catch (err: any) {
      console.error("Error updating vehicle:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update vehicle. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    router.push("/garage/vehicles")
  }

  if (!canWrite) {
    return null // Prevent flash of content before redirect
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Edit Vehicle</h2>
          </div>
          <p className="text-muted-foreground">Update vehicle information in your database.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the vehicle's basic details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner</FormLabel>
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="Toyota" {...field} />
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
                          <Input placeholder="Corolla" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2023" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="license_plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC-1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VIN</FormLabel>
                        <FormControl>
                          <Input placeholder="1HGCM82633A123456" {...field} />
                        </FormControl>
                        <FormDescription>Vehicle Identification Number</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Details</CardTitle>
                <CardDescription>Enter additional details about the vehicle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="vehicle_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Basic">Basic</SelectItem>
                            <SelectItem value="Luxury">Luxury</SelectItem>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicle_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormField
                    control={form.control}
                    name="engine_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Engine Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="fuel_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormLabel>Transmission</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transmission" />
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
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="mileage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mileage</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="50000" {...field} />
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
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="km">km</SelectItem>
                              <SelectItem value="miles">miles</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
