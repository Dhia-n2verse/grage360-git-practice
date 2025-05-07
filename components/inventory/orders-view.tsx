"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllStockOrders } from "@/lib/api/inventory"
import { toast } from "@/components/ui/use-toast"
import { LayoutGrid, LayoutList, ShoppingBag } from "lucide-react"
import { OrdersListView } from "./orders-list-view"
import { OrdersGridView } from "./orders-grid-view"

export function OrdersView() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"list" | "grid">("list")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await getAllStockOrders()
      setOrders(data)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    // Update the local state to reflect the change immediately
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, order_status: newStatus } : order)))
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Recent Orders</CardTitle>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as "list" | "grid")} className="w-auto">
            <TabsList className="grid w-[160px] grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <LayoutList className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">List</span>
              </TabsTrigger>
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Grid</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>All part orders sorted by date</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-4">No orders found</div>
        ) : (
          <>
            {view === "list" ? (
              <OrdersListView orders={orders} onStatusChange={handleOrderStatusChange} />
            ) : (
              <OrdersGridView orders={orders} onStatusChange={handleOrderStatusChange} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
