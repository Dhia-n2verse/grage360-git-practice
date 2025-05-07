"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { updateOrderStatus } from "@/lib/api/inventory"
import { Calendar, Clock, Package, Truck, X } from "lucide-react"

interface OrdersGridViewProps {
  orders: any[]
  onStatusChange: (orderId: string, newStatus: string) => void
}

export function OrdersGridView({ orders, onStatusChange }: OrdersGridViewProps) {
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    try {
      const result = await updateOrderStatus(orderId, newStatus)

      if (result.success) {
        onStatusChange(orderId, newStatus)
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => (
        <Card
          key={order.id}
          className={`overflow-hidden ${order.order_status === "Canceled" ? "opacity-60 bg-muted/30" : ""}`}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <h3 className="font-semibold">{order.stock?.name || "Unknown Part"}</h3>
                <p className="text-sm text-muted-foreground">{order.stock?.supplier?.name || "Unknown Supplier"}</p>
              </div>
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
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(order.order_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Qty: {order.quantity}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <span className="text-sm font-medium">Total: {formatCurrency(order.total_price)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
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

            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(order.id, "Shipped")}
                      disabled={
                        updatingOrderId === order.id ||
                        order.order_status === "Shipped" ||
                        order.order_status === "Canceled"
                      }
                      className={order.order_status === "Shipped" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
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
                      onClick={() => handleStatusChange(order.id, "Canceled")}
                      disabled={
                        updatingOrderId === order.id ||
                        order.order_status === "Shipped" ||
                        order.order_status === "Canceled"
                      }
                      className={order.order_status === "Canceled" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
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
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
