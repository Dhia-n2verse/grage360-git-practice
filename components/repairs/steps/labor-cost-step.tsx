"use client"

import { useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useRepairFormContext } from "../multi-step-repair-form"

export function LaborCostStep() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext()
  const { totalPartsCost } = useRepairFormContext()

  const laborCost = watch("labor_cost") || 0
  const totalCost = totalPartsCost + Number(laborCost)

  // Update total cost whenever labor cost or parts cost changes
  useEffect(() => {
    setValue("total_cost", totalCost)
  }, [laborCost, totalPartsCost, setValue, totalCost])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="labor_cost">Labor Cost</Label>
        <Input
          id="labor_cost"
          type="number"
          step="0.01"
          min="0"
          placeholder="Enter labor cost"
          {...register("labor_cost")}
        />
        {errors.labor_cost && <p className="text-sm text-red-500">{errors.labor_cost.message as string}</p>}
      </div>

      <Card>
        <CardContent className="pt-6">
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
    </div>
  )
}
