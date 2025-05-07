"use client"

import { useFormContext } from "react-hook-form"
import { Car, User, Phone, Mail, Calendar, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useRepairFormContext } from "../multi-step-repair-form"
import { format } from "date-fns"

export function VehicleCustomerStep() {
  const { watch } = useFormContext()
  const { vehicle, customer, diagnostic } = useRepairFormContext()

  if (!vehicle || !customer) {
    return (
      <div className="space-y-6">
        <div className="text-center p-8">
          <p className="text-muted-foreground">
            Please select a diagnostic first to view vehicle and customer information.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Vehicle Information</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="font-medium w-24">Make/Model:</span>
                  <span>
                    {vehicle.make} {vehicle.model}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Year:</span>
                  <span>{vehicle.model_year || "N/A"}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">License:</span>
                  <span>{vehicle.license_plate || "N/A"}</span>
                </div>
                {vehicle.vin && (
                  <div className="flex items-start">
                    <span className="font-medium w-24">VIN:</span>
                    <span>{vehicle.vin}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Customer Information</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="font-medium w-24">Name:</span>
                  <span>
                    {customer.first_name} {customer.last_name}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Email:</span>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{customer.email || "N/A"}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Phone:</span>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{customer.phone || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {diagnostic && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Diagnostic Information</h3>
              </div>
              <div className="space-y-2">
                {diagnostic.created_at && (
                  <div className="flex items-start">
                    <span className="font-medium w-24">Date:</span>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{format(new Date(diagnostic.created_at), "PPP")}</span>
                    </div>
                  </div>
                )}
                {diagnostic.observation && (
                  <div className="flex items-start">
                    <span className="font-medium w-24">Observation:</span>
                    <span className="flex-1">{diagnostic.observation}</span>
                  </div>
                )}
                {diagnostic.recommendation && (
                  <div className="flex items-start">
                    <span className="font-medium w-24">Recommendation:</span>
                    <span className="flex-1">{diagnostic.recommendation}</span>
                  </div>
                )}
                {diagnostic.error_codes && diagnostic.error_codes.length > 0 && (
                  <div className="flex items-start">
                    <span className="font-medium w-24">Error Codes:</span>
                    <div className="flex flex-wrap gap-2">
                      {diagnostic.error_codes.map((error: any, index: number) => (
                        <div key={index} className="text-sm bg-muted p-1 rounded">
                          {error.code} - {error.related_system}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
