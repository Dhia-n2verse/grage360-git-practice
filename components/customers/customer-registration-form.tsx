"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, ChevronDown, UserCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Define schema for form validation
const personalCustomerSchema = z.object({
  type: z.literal("personal"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  birth_date: z.union([z.date().optional(), z.string().optional()]),
  company_name: z.string().optional(),
  fiscal_id: z.string().optional(),
  company_address: z.string().optional(),
})

const businessCustomerSchema = personalCustomerSchema.extend({
  type: z.literal("business"),
  company_name: z.string().min(1, "Company name is required"),
  fiscal_id: z.string().min(1, "Fiscal ID is required"),
  company_address: z.string().min(1, "Company address is required"),
})

const customerSchema = z.discriminatedUnion("type", [personalCustomerSchema, businessCustomerSchema])

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerRegistrationFormProps {
  onCustomerRegistered: (customer: any) => void
  canWrite: boolean
}

export function CustomerRegistrationForm({ onCustomerRegistered, canWrite }: CustomerRegistrationFormProps) {
  const { toast } = useToast()
  const [isBusinessCustomer, setIsBusinessCustomer] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDetailedView, setIsDetailedView] = useState(false)
  const [birthDateInput, setBirthDateInput] = useState<string>("")

  // Initialize form with default values
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(isBusinessCustomer ? businessCustomerSchema : personalCustomerSchema),
    defaultValues: {
      type: "personal" as const,
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      company_name: "",
      fiscal_id: "",
      company_address: "",
    },
  })

  // Handle customer type toggle
  const handleCustomerTypeChange = (isBusinessCustomer: boolean) => {
    setIsBusinessCustomer(isBusinessCustomer)
    form.setValue("type", isBusinessCustomer ? "business" : "personal")
  }

  // Handle manual birth date input
  const handleBirthDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBirthDateInput(value)

    // Try to parse the date
    if (value) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          form.setValue("birth_date", date)
        } else {
          form.setValue("birth_date", value)
        }
      } catch (err) {
        form.setValue("birth_date", value)
      }
    } else {
      form.setValue("birth_date", undefined)
    }
  }

  // Handle form submission
  const onSubmit = async (data: CustomerFormValues) => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to register customers.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Format birth date properly
      let formattedBirthDate = null
      if (data.birth_date) {
        if (typeof data.birth_date === "string") {
          // Try to parse the string as a date
          try {
            const parsedDate = new Date(data.birth_date)
            if (!isNaN(parsedDate.getTime())) {
              formattedBirthDate = format(parsedDate, "yyyy-MM-dd")
            } else {
              formattedBirthDate = data.birth_date
            }
          } catch (err) {
            formattedBirthDate = data.birth_date
          }
        } else {
          formattedBirthDate = format(data.birth_date, "yyyy-MM-dd")
        }
      }

      // Insert customer data
      const { data: customerData, error } = await supabase
        .from("customers")
        .insert([
          {
            ...data,
            birth_date: formattedBirthDate,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Notify parent component
      onCustomerRegistered(customerData)

      // Reset form but keep customer type
      const customerType = isBusinessCustomer
      form.reset({
        type: isBusinessCustomer ? "business" : "personal",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        company_name: "",
        fiscal_id: "",
        company_address: "",
      })
      setBirthDateInput("")
      setIsBusinessCustomer(customerType)
    } catch (err: any) {
      console.error("Error registering customer:", err)
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: err.message || "Failed to register customer. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Registration Form</h2>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${!isDetailedView ? "text-primary" : "text-muted-foreground"}`}>Simple</span>
            <Switch checked={isDetailedView} onCheckedChange={setIsDetailedView} disabled={isSubmitting} />
            <span className={`text-sm ${isDetailedView ? "text-primary" : "text-muted-foreground"}`}>Detailed</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Placeholder - Centered at the top */}
            <div className="flex flex-col items-center mb-8">
              <Avatar className="h-32 w-32">
                <AvatarFallback className="bg-muted text-muted-foreground text-4xl">
                  <UserCircle className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="grid gap-6">
              {/* Basic Information - Always visible */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter street address" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Business-specific fields in Simple mode */}
              {isBusinessCustomer && !isDetailedView && (
                <div className="space-y-4 border-t pt-4 mt-4">
                  <h3 className="font-medium">Business Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fiscal_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fiscal ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter fiscal ID" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Detailed Information - Only visible in detailed mode */}
              {isDetailedView && (
                <Collapsible defaultOpen={true} className="border rounded-md">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 font-medium">
                    <span>Additional Information</span>
                    <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 pt-0 space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter city" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter state" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter postal code" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="birth_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                type="text"
                                placeholder="YYYY-MM-DD"
                                value={birthDateInput}
                                onChange={handleBirthDateInputChange}
                                disabled={isSubmitting}
                              />
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" disabled={isSubmitting}>
                                  <CalendarIcon className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                  mode="single"
                                  selected={field.value instanceof Date ? field.value : undefined}
                                  onSelect={(date) => {
                                    field.onChange(date)
                                    if (date) {
                                      setBirthDateInput(format(date, "yyyy-MM-dd"))
                                    } else {
                                      setBirthDateInput("")
                                    }
                                  }}
                                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Business-specific fields in detailed view */}
                    {isBusinessCustomer && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-medium">Business Information</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="company_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter company name" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="fiscal_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fiscal ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter fiscal ID" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="company_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Address</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter company address" {...field} disabled={isSubmitting} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="customer-type"
                checked={isBusinessCustomer}
                onCheckedChange={handleCustomerTypeChange}
                disabled={isSubmitting}
              />
              <Label htmlFor="customer-type">{isBusinessCustomer ? "Business Customer" : "Personal Customer"}</Label>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Customer"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
