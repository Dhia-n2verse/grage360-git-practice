"use client"

import { Briefcase, Mail, MapPin, Phone, UserCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getInitials, getRoleColor } from "@/lib/utils"

interface CustomerQuickViewProps {
  customer: any
  onViewDetails: () => void
}

export function CustomerQuickView({ customer, onViewDetails }: CustomerQuickViewProps) {
  if (!customer) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Customer Selected</h3>
          <p className="text-muted-foreground mb-4">Select a customer from the list to view their details</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="sticky top-4">
      <CardContent className="p-6">
        <div className="flex flex-col items-center mb-4">
          <Avatar className="h-24 w-24 mb-4">
            {customer.image ? (
              <AvatarImage
                src={customer.image || "/placeholder.svg"}
                alt={`${customer.first_name} ${customer.last_name}`}
              />
            ) : (
              <AvatarFallback className={getRoleColor(customer.role)}>
                {getInitials(`${customer.first_name} ${customer.last_name}`)}
              </AvatarFallback>
            )}
          </Avatar>
          <h2 className="text-xl font-bold">
            {customer.first_name} {customer.last_name}
          </h2>
          {customer.company_name && <p className="text-muted-foreground">{customer.company_name}</p>}
          <Badge
            variant={customer.type === "business" ? "default" : "secondary"}
            className={`mt-2 ${
              customer.type === "business" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {customer.type === "business" ? (
              <Briefcase className="mr-1 h-3 w-3" />
            ) : (
              <UserCircle className="mr-1 h-3 w-3" />
            )}
            {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
          </Badge>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{customer.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{customer.phone}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Address</h3>
            <div className="space-y-1">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p>{customer.address}</p>
                  {(customer.city || customer.state || customer.postal_code) && (
                    <p className="text-muted-foreground">
                      {customer.city}
                      {customer.state ? `, ${customer.state}` : ""}
                      {customer.postal_code ? ` ${customer.postal_code}` : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <Button className="w-full" onClick={onViewDetails}>
          View Full Details
        </Button>
      </CardContent>
    </Card>
  )
}
