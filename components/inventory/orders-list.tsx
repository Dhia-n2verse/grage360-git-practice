"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { getAllStockOrders, updateOrderStatus } from "@/lib/api/inventory"
import { Clock, ShoppingBag, Truck, X } from "lucide-react"

export function OrdersList() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    try {
      const result = await updateOrderStatus(orderId, newStatus)

      if (result.success) {
        // Update the local state to reflect the change
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, order_status: newStatus } : order)))

        toast({
          title: "Status Updated",
          description: `Order status changed to ${newStatus}`,
          variant: "default",
        })
      } else {
        toast({
          title: "Update Failed",
          description: "Could not update order status. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating the status.",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId)
    try {
      const result = await updateOrderStatus(orderId, "Canceled")

      if (result.success) {
        // Update the local state to reflect the change
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, order_status: "Canceled" } : order)))

        toast({
          title: "Order Canceled",
          description: "The order has been canceled successfully",
          variant: "default",
        })
      } else {
        toast({
          title: "Cancellation Failed",
          description: "Could not cancel the order. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error canceling order:", error)
      toast({
        title: "Error",
        description: "An error occurred while canceling the order.",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const formatCurrency = (value?: number) => {
    if (value === undefined) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Recent Orders</CardTitle>
        </div>
        <CardDescription>All part orders sorted by date</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-4">No orders found</div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Part</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={order.order_status === "Canceled" ? "opacity-60 bg-muted/30" : ""}
                  >
                    <TableCell className="font-medium">{formatDate(order.order_date)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.stock?.name || "Unknown Part"}</span>
                        <span className="text-xs text-muted-foreground">
                          {order.stock?.supplier?.name || "Unknown Supplier"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{order.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.total_price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          order.order_status === "Shipped"
                            ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                            : order.order_status === "Pending"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200"
                              : order.order_status === "Canceled"
                                ? "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                                : ""
                        }
                      >
                        {order.order_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={order.order_status === "Pending" ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => handleStatusChange(order.id, "Pending")}
                                disabled={
                                  updatingOrderId === order.id ||
                                  order.order_status === "Pending" ||
                                  order.order_status === "Shipped" ||
                                  order.order_status === "Canceled"
                                }
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Pending
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as pending</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={order.order_status === "Shipped" ? "success" : "outline"}
                                size="sm"
                                onClick={() => handleStatusChange(order.id, "Shipped")}
                                disabled={
                                  updatingOrderId === order.id ||
                                  order.order_status === "Shipped" ||
                                  order.order_status === "Canceled"
                                }
                                className={
                                  order.order_status === "Shipped" ? "bg-green-600 hover:bg-green-700 text-white" : ""
                                }
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                Shipped
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as shipped</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={
                                  updatingOrderId === order.id ||
                                  order.order_status === "Shipped" ||
                                  order.order_status === "Canceled"
                                }
                                className={
                                  order.order_status === "Canceled" ? "bg-red-600 hover:bg-red-700 text-white" : ""
                                }
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cancel order</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
