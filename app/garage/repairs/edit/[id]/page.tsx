import type { Metadata } from "next"
import { RepairForm } from "@/components/repairs/repair-form"

export const metadata: Metadata = {
  title: "Edit Repair | Garage Management",
  description: "Edit vehicle repair record",
}

interface EditRepairPageProps {
  params: {
    id: string
  }
}

export default function EditRepairPage({ params }: EditRepairPageProps) {
  return (
    <div className="container mx-auto py-6">
      <RepairForm id={params.id} />
    </div>
  )
}
