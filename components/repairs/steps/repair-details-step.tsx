"use client"

import { useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

export function RepairDetailsStep() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext()
  const notifyCustomer = watch("notify_customer")

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter a detailed description of the repair"
          className="min-h-[100px]"
          {...register("description")}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Enter any additional notes or instructions"
          className="min-h-[100px]"
          {...register("notes")}
        />
        {errors.notes && <p className="text-sm text-red-500">{errors.notes.message as string}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="notify_customer"
          checked={notifyCustomer}
          onCheckedChange={(checked) => setValue("notify_customer", checked)}
        />
        <Label htmlFor="notify_customer">Notify customer when repair is completed</Label>
      </div>
    </div>
  )
}
