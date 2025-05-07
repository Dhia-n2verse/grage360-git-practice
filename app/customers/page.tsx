import { CollapsibleLayout } from "@/components/layout/collapsible-layout"
import { RecordsList } from "@/components/records-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CustomersPage() {
  return (
    <CollapsibleLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer records</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <RecordsList />
    </CollapsibleLayout>
  )
}
