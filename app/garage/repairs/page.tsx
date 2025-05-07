import type { Metadata } from "next"
import { RepairsList } from "@/components/repairs/repairs-list"

export const metadata: Metadata = {
  title: "Repairs | Garage Management",
  description: "Manage vehicle repairs and maintenance",
}

export default function RepairsPage() {
  return (
    <div className="container mx-auto py-6">
      <RepairsList />
    </div>
  )
}
