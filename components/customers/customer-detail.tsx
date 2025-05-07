"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Pencil, Trash2, UserCircle, Briefcase, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getInitials } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface CustomerDetailProps {
  customer: any
  canWrite: boolean
  canDisable: boolean
  onCustomerUpdated: () => void
}

export function CustomerDetail({ customer, canWrite, canDisable, onCustomerUpdated }: CustomerDetailProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isDisabling, setIsDisabling] = useState(false)

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not provided"
    try {
      return format(new Date(dateString), "PPP")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Update the handleEditCustomer function to navigate to an edit form
  const handleEditCustomer = () => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to edit customers.",
      })
      return
    }

    // Navigate to edit form with customer ID
    router.push(`/garage/customers/edit/${customer.id}`)
  }

  // Update the handleDisableCustomer function to properly handle disabling
  const handleDisableCustomer = async () => {
    if (!canDisable) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to disable customers.",
      })
      return
    }

    setIsDisabling(true)
    try {
      const { error } = await supabase.from("customers").update({ status: "disabled" }).eq("id", customer.id)

      if (error) throw error

      toast({
        title: "Customer Disabled",
        description: "The customer has been successfully disabled.",
      })

      onCustomerUpdated()
    } catch (err: any) {
      console.error("Error disabling customer:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to disable customer. Please try again.",
      })
    } finally {
      setIsDisabling(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customer Details</CardTitle>
            <CardDescription>View detailed information about this customer.</CardDescription>
          </div>
          <Badge variant={customer.type === "business" ? "default" : "secondary"} className="ml-auto">
            {customer.type === "business" ? (
              <Briefcase className="mr-1 h-3 w-3" />
            ) : (
              <UserCircle className="mr-1 h-3 w-3" />
            )}
            {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-32 w-32">
              {customer.image ? (
                <AvatarImage
                  src={customer.image || "/placeholder.svg"}
                  alt={`${customer.first_name} ${customer.last_name}`}
                />
              ) : (
                <AvatarFallback className="text-2xl">
                  {getInitials(`${customer.first_name} ${customer.last_name}`)}
                </AvatarFallback>
              )}
            </Avatar>
            <h3 className="text-xl font-bold text-center">
              {customer.first_name} {customer.last_name}
            </h3>
            {customer.type === "business" && (
              <p className="text-muted-foreground text-center">{customer.company_name}</p>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="font-medium w-24">Email:</span>
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-24">Phone:</span>
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-24">Birth Date:</span>
                    <span>{formatDate(customer.birth_date)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Address</h4>
                <div className="space-y-1">
                  <p>{customer.address}</p>
                  <p>
                    {customer.city}, {customer.state} {customer.postal_code}
                  </p>
                </div>
              </div>
            </div>

            {customer.type === "business" && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Business Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="font-medium w-24">Company:</span>
                      <span>{customer.company_name}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium w-24">Fiscal ID:</span>
                      <span>{customer.fiscal_id}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium w-24">Address:</span>
                      <span>{customer.company_address}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <Separator />

        <div className="text-sm text-muted-foreground">
          <p>Customer ID: {customer.id}</p>
          <p>Registered on: {formatDate(customer.created_at)}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {canWrite && (
          <Button variant="outline" onClick={handleEditCustomer}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Customer
          </Button>
        )}
        {canDisable && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Disable Customer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disable Customer</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to disable this customer? This action can be reversed by an administrator.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 dark:bg-amber-900 dark:text-amber-200 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">
                    Disabling this customer will hide them from active views but not delete their data.
                  </p>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisableCustomer} disabled={isDisabling}>
                  {isDisabling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    "Disable Customer"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  )
}
