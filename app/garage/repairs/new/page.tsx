import type { Metadata } from "next"
import { MultiStepRepairForm } from "@/components/repairs/multi-step-repair-form"

export const metadata: Metadata = {
  title: "New Repair | Garage Management",
  description: "Create a new vehicle repair record",
}

export default function NewRepairPage() {
  return (
    <div className="container mx-auto py-6">
      <MultiStepRepairForm />
    </div>
  )
}
