"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { updateOrderStatus } from "@/lib/api/inventory"
import { Clock, Truck, X } from "lucide-react"

interface OrdersListViewProps {
  orders: any[]
  onStatusChange: (orderId: string, newStatus: string) => void
}

export function OrdersListView({ orders, onStatusChange }: OrdersListViewProps) {
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
          description: result.error?.message || "Could not update order status. Please try again.",
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
            <TableRow key={order.id} className={order.order_status === "Canceled" ? "opacity-60 bg-muted/30" : ""}>
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
                          variant="outline"
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
