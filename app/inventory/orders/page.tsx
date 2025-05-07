import { OrdersView } from "@/components/inventory/orders-view"

export default function OrdersPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Recent Orders</h1>
        <p className="text-muted-foreground">
          View and manage all part orders with detailed information and status updates.
        </p>
      </div>
      <OrdersView />
    </div>
  )
}
