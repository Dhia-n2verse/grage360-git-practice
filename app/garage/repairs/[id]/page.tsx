import type { Metadata } from "next"
import { RepairDetail } from "@/components/repairs/repair-detail"

export const metadata: Metadata = {
  title: "Repair Details | Garage Management",
  description: "View repair details",
}

interface RepairDetailPageProps {
  params: {
    id: string
  }
}

export default function RepairDetailPage({ params }: RepairDetailPageProps) {
  return (
    <div className="container mx-auto py-6">
      <RepairDetail id={params.id} />
    </div>
  )
}
