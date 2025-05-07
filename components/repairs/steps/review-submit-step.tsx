"use client"

import { useFormContext } from "react-hook-form"
import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRepairFormContext } from "../multi-step-repair-form"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

export function ReviewSubmitStep() {
  const { watch } = useFormContext()
  const { repairItems, totalPartsCost, vehicle, customer, diagnostic, technicians } = useRepairFormContext()

  const formValues = watch()
  const laborCost = formValues.labor_cost || 0
  const totalCost = totalPartsCost + Number(laborCost)
  const selectedTechnicianIds = formValues.technician_specialty_ids || []

  const selectedTechnicians = technicians.filter((tech) => selectedTechnicianIds.includes(tech.id))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Vehicle & Customer</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle:</span>
                <span className="font-medium">
                  {vehicle?.make} {vehicle?.model} ({vehicle?.license_plate || "No plate"})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">
                  {customer?.first_name} {customer?.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact:</span>
                <span>{customer?.phone || customer?.email || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Repair Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge>{formValues.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Progress:</span>
                <span>{formValues.progress}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notify Customer:</span>
                <span>{formValues.notify_customer ? "Yes" : "No"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Description & Notes</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
              <p className="mt-1">{formValues.description || "No description provided"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
              <p className="mt-1">{formValues.notes || "No notes provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Parts & Materials</h3>
          {repairItems.length > 0 ? (
            <div className="space-y-2">
              {repairItems.map((item, index) => (
                <div key={index} className="flex justify-between py-1 border-b last:border-0">
                  <span>
                    {item.quantity}x {item.stock_item?.name}
                  </span>
                  <span>{formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No parts added</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Assigned Technicians</h3>
          {selectedTechnicians.length > 0 ? (
            <div className="space-y-2">
              {selectedTechnicians.map((tech) => (
                <div key={tech.id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(tech.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{tech.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tech.specialties.map((s: any) => s.name).join(", ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No technicians assigned</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Cost Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Parts Cost:</span>
              <span>{formatCurrency(totalPartsCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Labor Cost:</span>
              <span>{formatCurrency(Number(laborCost))}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total Cost:</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTechnicians.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Technicians Assigned</AlertTitle>
          <AlertDescription>
            This repair will be created without any assigned technicians. You can assign technicians later.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
