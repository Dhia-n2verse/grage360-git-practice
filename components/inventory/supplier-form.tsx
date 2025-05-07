"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Save, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  createSupplier,
  updateSupplier,
  getSupplierById,
  type Supplier,
  type ProductCategory,
} from "@/lib/api/inventory"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone_number: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  rank_item: z.coerce
    .number()
    .int()
    .min(1, "Rank must be between 1 and 5")
    .max(5, "Rank must be between 1 and 5")
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

interface SupplierFormProps {
  id?: string
}

export function SupplierForm({ id }: SupplierFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState<Supplier | null>(null)
  const [specialities, setSpecialities] = useState<ProductCategory[]>([])
  const [vehicleMakes, setVehicleMakes] = useState<string[]>([])
  const [newMake, setNewMake] = useState("")

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
      phone_number: "",
      email: "",
      address: "",
      website: "",
      rank_item: 3,
    },
  })

  useEffect(() => {
    if (id) {
      const fetchSupplier = async () => {
        setLoading(true)
        try {
          const data = await getSupplierById(id)
          if (data) {
            setInitialData(data)
            form.reset({
              name: data.name,
              phone_number: data.phone_number || "",
              email: data.email || "",
              address: data.address || "",
              website: data.website || "",
              rank_item: data.rank_item,
            })
            setSpecialities(data.speciality || [])
            setVehicleMakes(data.recommended_vehicle_make || [])
          }
        } catch (error) {
          console.error("Failed to fetch supplier:", error)
          toast({
            title: "Error",
            description: "Failed to load supplier data",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }

      fetchSupplier()
    }
  }, [id, form, toast])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const supplierData: Supplier = {
        ...values,
        speciality: specialities,
        recommended_vehicle_make: vehicleMakes,
      }

      let result
      if (id) {
        result = await updateSupplier(id, supplierData)
      } else {
        result = await createSupplier(supplierData)
      }

      if (result.success) {
        toast({
          title: "Success",
          description: id ? "Supplier updated successfully" : "Supplier created successfully",
        })
        router.push("/inventory/suppliers")
      } else {
        throw new Error(result.error || "An error occurred")
      }
    } catch (error) {
      console.error("Failed to save supplier:", error)
      toast({
        title: "Error",
        description: "Failed to save supplier",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddSpeciality = (speciality: ProductCategory) => {
    if (!specialities.includes(speciality)) {
      setSpecialities([...specialities, speciality])
    }
  }

  const handleRemoveSpeciality = (speciality: ProductCategory) => {
    setSpecialities(specialities.filter((s) => s !== speciality))
  }

  const handleAddVehicleMake = () => {
    if (newMake && !vehicleMakes.includes(newMake)) {
      setVehicleMakes([...vehicleMakes, newMake])
      setNewMake("")
    }
  }

  const handleRemoveVehicleMake = (make: string) => {
    setVehicleMakes(vehicleMakes.filter((m) => m !== make))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">{id ? "Edit Supplier" : "Add New Supplier"}</h2>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
            <CardDescription>Enter the details of the supplier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Supplier Name *</Label>
                <Input id="name" placeholder="Enter supplier name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input id="phone_number" placeholder="Enter phone number" {...form.register("phone_number")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter email address" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" placeholder="Enter website URL" {...form.register("website")} />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-500">{form.formState.errors.website.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" placeholder="Enter supplier address" rows={3} {...form.register("address")} />
            </div>

            <div className="space-y-2">
              <Label>Specialities</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {specialities.map((speciality) => (
                  <Badge key={speciality} variant="secondary" className="flex items-center gap-1">
                    {speciality}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleRemoveSpeciality(speciality)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </Badge>
                ))}
              </div>
              <Select onValueChange={handleAddSpeciality}>
                <SelectTrigger>
                  <SelectValue placeholder="Add speciality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Categories</SelectLabel>
                    {productCategories
                      .filter((category) => !specialities.includes(category))
                      .map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recommended Vehicle Makes</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {vehicleMakes.map((make) => (
                  <Badge key={make} variant="outline" className="flex items-center gap-1">
                    {make}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleRemoveVehicleMake(make)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add vehicle make" value={newMake} onChange={(e) => setNewMake(e.target.value)} />
                <Button type="button" variant="outline" size="icon" onClick={handleAddVehicleMake} disabled={!newMake}>
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rank_item">Supplier Ranking (1-5)</Label>
              <Input
                id="rank_item"
                type="number"
                min="1"
                max="5"
                placeholder="Enter ranking"
                {...form.register("rank_item")}
              />
              {form.formState.errors.rank_item && (
                <p className="text-sm text-red-500">{form.formState.errors.rank_item.message}</p>
              )}
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
