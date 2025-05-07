import { supabase } from "@/lib/supabase"

// Types
export type ProductCategory =
  | "Engine Components"
  | "Oils & Filters"
  | "Wheels & Brakes"
  | "Electrical Components"
  | "Transmission & Clutch"
  | "Suspension Systems"
  | "Body & Trim"
  | "Other"

export interface StockItem {
  id?: string
  name: string
  part_reference?: string
  quantity: number
  unit_selling_price?: number
  unit_purchase_price?: number
  product_link?: string
  product_description?: string
  category?: ProductCategory
  minimum_quantity_to_order?: number
  supplier_id?: string
  supplier?: Supplier
  created_at?: string
  updated_at?: string
}

export interface Supplier {
  id?: string
  name: string
  phone_number?: string
  email?: string
  recommended_vehicle_make?: string[]
  address?: string
  website?: string
  speciality?: ProductCategory[]
  rank_item?: number
  created_at?: string
  updated_at?: string
}

export interface StockOrder {
  id?: string
  stock_id: string
  order_date?: string
  quantity: number
  unit_price: number
  total_price: number
  order_status?: string
  created_at?: string
  updated_at?: string
}

export interface StockFilter {
  category?: ProductCategory
  minQuantity?: number
  maxQuantity?: number
  minPrice?: number
  maxPrice?: number
  name?: string
  supplier_id?: string
  lowStock?: boolean
}

export interface SupplierFilter {
  speciality?: ProductCategory
  recommendedMake?: string
  minRank?: number
  maxRank?: number
}

// Stock API
export async function getStockItems(
  page = 1,
  pageSize = 10,
  filter?: StockFilter,
  sortBy = "name",
  sortOrder: "asc" | "desc" = "asc",
): Promise<{ data: StockItem[]; count: number }> {
  try {
    let query = supabase
      .from("stock_tracking")
      .select("*, supplier:suppliers(*)", { count: "exact" })
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range((page - 1) * pageSize, page * pageSize - 1)

    // Apply filters
    if (filter) {
      if (filter.category) {
        query = query.eq("category", filter.category)
      }
      if (filter.minQuantity !== undefined) {
        query = query.gte("quantity", filter.minQuantity)
      }
      if (filter.maxQuantity !== undefined) {
        query = query.lte("quantity", filter.maxQuantity)
      }
      if (filter.minPrice !== undefined) {
        query = query.gte("unit_selling_price", filter.minPrice)
      }
      if (filter.maxPrice !== undefined) {
        query = query.lte("unit_selling_price", filter.maxPrice)
      }
      if (filter.name) {
        query = query.ilike("name", `%${filter.name}%`)
      }
      if (filter.supplier_id) {
        query = query.eq("supplier_id", filter.supplier_id)
      }
      if (filter.lowStock) {
        query = query.lt("quantity", supabase.raw("minimum_quantity_to_order"))
      }
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching stock items:", error)
      return { data: [], count: 0 }
    }

    return { data: data || [], count: count || 0 }
  } catch (error) {
    console.error("Exception fetching stock items:", error)
    return { data: [], count: 0 }
  }
}

export async function getStockItemById(id: string): Promise<StockItem | null> {
  try {
    const { data, error } = await supabase
      .from("stock_tracking")
      .select("*, supplier:suppliers(*)")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching stock item:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Exception fetching stock item:", error)
    return null
  }
}

export async function createStockItem(item: StockItem): Promise<{ success: boolean; data?: StockItem; error?: any }> {
  try {
    const { data, error } = await supabase.from("stock_tracking").insert([item]).select().single()

    if (error) {
      console.error("Error creating stock item:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Exception creating stock item:", error)
    return { success: false, error }
  }
}

export async function updateStockItem(
  id: string,
  item: Partial<StockItem>,
): Promise<{ success: boolean; data?: StockItem; error?: any }> {
  try {
    const { data, error } = await supabase.from("stock_tracking").update(item).eq("id", id).select().single()

    if (error) {
      console.error("Error updating stock item:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Exception updating stock item:", error)
    return { success: false, error }
  }
}

export async function deleteStockItem(id: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.from("stock_tracking").delete().eq("id", id)

    if (error) {
      console.error("Error deleting stock item:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Exception deleting stock item:", error)
    return { success: false, error }
  }
}

// Supplier API
export async function getSuppliers(
  page = 1,
  pageSize = 10,
  filter?: SupplierFilter,
  sortBy = "name",
  sortOrder: "asc" | "desc" = "asc",
): Promise<{ data: Supplier[]; count: number }> {
  try {
    let query = supabase
      .from("suppliers")
      .select("*", { count: "exact" })
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range((page - 1) * pageSize, page * pageSize - 1)

    // Apply filters
    if (filter) {
      if (filter.speciality) {
        query = query.contains("speciality", [filter.speciality])
      }
      if (filter.recommendedMake) {
        query = query.contains("recommended_vehicle_make", [filter.recommendedMake])
      }
      if (filter.minRank !== undefined) {
        query = query.gte("rank_item", filter.minRank)
      }
      if (filter.maxRank !== undefined) {
        query = query.lte("rank_item", filter.maxRank)
      }
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching suppliers:", error)
      return { data: [], count: 0 }
    }

    return { data: data || [], count: count || 0 }
  } catch (error) {
    console.error("Exception fetching suppliers:", error)
    return { data: [], count: 0 }
  }
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  try {
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching supplier:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Exception fetching supplier:", error)
    return null
  }
}

export async function createSupplier(supplier: Supplier): Promise<{ success: boolean; data?: Supplier; error?: any }> {
  try {
    const { data, error } = await supabase.from("suppliers").insert([supplier]).select().single()

    if (error) {
      console.error("Error creating supplier:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Exception creating supplier:", error)
    return { success: false, error }
  }
}

export async function updateSupplier(
  id: string,
  supplier: Partial<Supplier>,
): Promise<{ success: boolean; data?: Supplier; error?: any }> {
  try {
    const { data, error } = await supabase.from("suppliers").update(supplier).eq("id", id).select().single()

    if (error) {
      console.error("Error updating supplier:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Exception updating supplier:", error)
    return { success: false, error }
  }
}

export async function deleteSupplier(id: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.from("suppliers").delete().eq("id", id)

    if (error) {
      console.error("Error deleting supplier:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Exception deleting supplier:", error)
    return { success: false, error }
  }
}

// Stock Orders API
export async function getStockOrders(stockId: string): Promise<StockOrder[]> {
  try {
    const { data, error } = await supabase
      .from("stock_orders")
      .select("*")
      .eq("stock_id", stockId)
      .order("order_date", { ascending: false })

    if (error) {
      console.error("Error fetching stock orders:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching stock orders:", error)
    return []
  }
}

// Add a function to get the order history for a stock item with supplier information
export async function getStockOrdersWithSupplier(stockId: string): Promise<any[]> {
  try {
    // Modified query to follow the correct relationship path
    const { data, error } = await supabase
      .from("stock_orders")
      .select(`
        *,
        stock:stock_tracking(name, part_reference)
      `)
      .eq("stock_id", stockId)
      .order("order_date", { ascending: false })

    if (error) {
      console.error("Error fetching stock orders:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching stock orders:", error)
    return []
  }
}

export async function createStockOrder(
  order: StockOrder,
): Promise<{ success: boolean; data?: StockOrder; error?: any }> {
  try {
    // Start a transaction
    const { data: orderData, error: orderError } = await supabase.from("stock_orders").insert([order]).select().single()

    if (orderError) {
      console.error("Error creating stock order:", orderError)
      return { success: false, error: orderError }
    }

    // If order status is "Shipped", update the stock quantity
    if (order.order_status === "Shipped") {
      // Get current stock item
      const { data: stockItem, error: stockError } = await supabase
        .from("stock_tracking")
        .select("quantity")
        .eq("id", order.stock_id)
        .single()

      if (stockError) {
        console.error("Error fetching stock item:", stockError)
        return { success: true, data: orderData } // Still return success for the order
      }

      // Update stock quantity
      const newQuantity = stockItem.quantity + order.quantity
      const { error: updateError } = await supabase
        .from("stock_tracking")
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq("id", order.stock_id)

      if (updateError) {
        console.error("Error updating stock quantity:", updateError)
        // Still return success for the order
      }
    }

    return { success: true, data: orderData }
  } catch (error) {
    console.error("Exception creating stock order:", error)
    return { success: false, error }
  }
}

// Get all stock orders with stock and supplier information
export async function getAllStockOrders(): Promise<any[]> {
  try {
    // Modified query to follow the correct relationship path
    const { data, error } = await supabase
      .from("stock_orders")
      .select(`
        *,
        stock:stock_tracking(id, name, part_reference, supplier:suppliers(id, name))
      `)
      .order("order_date", { ascending: false })

    if (error) {
      console.error("Error fetching all stock orders:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching all stock orders:", error)
    return []
  }
}

// Update order status and handle inventory changes if needed
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    // First, get the current order to check its status and details
    const { data: currentOrder, error: fetchError } = await supabase
      .from("stock_orders")
      .select("*, stock_id, quantity, order_status")
      .eq("id", orderId)
      .single()

    if (fetchError) {
      console.error("Error fetching order:", fetchError)
      return { success: false, error: fetchError }
    }

    // If the order is already shipped or canceled, don't allow status changes
    if (currentOrder.order_status === "Shipped" || currentOrder.order_status === "Canceled") {
      return {
        success: false,
        error: { message: `Cannot change status of an order that is already ${currentOrder.order_status}` },
      }
    }

    // Update the order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from("stock_orders")
      .update({
        order_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating order status:", updateError)
      return { success: false, error: updateError }
    }

    // Handle inventory changes if status changed to "Shipped"
    const oldStatus = currentOrder.order_status

    // If changing to Shipped, increase inventory
    if (newStatus === "Shipped") {
      // Get current stock quantity
      const { data: stockItem, error: stockError } = await supabase
        .from("stock_tracking")
        .select("quantity")
        .eq("id", currentOrder.stock_id)
        .single()

      if (stockError) {
        console.error("Error fetching stock item:", stockError)
        return { success: true, data: updatedOrder } // Still return success for the status update
      }

      // Update stock quantity (add the ordered quantity)
      const newQuantity = stockItem.quantity + currentOrder.quantity
      const { error: updateStockError } = await supabase
        .from("stock_tracking")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentOrder.stock_id)

      if (updateStockError) {
        console.error("Error updating stock quantity:", updateStockError)
        // Still return success for the status update
      }
    }
    // If changing from Shipped to another status (which shouldn't happen based on our rules)
    else if (oldStatus === "Shipped" && newStatus !== "Shipped") {
      console.warn("Changing from Shipped status is not allowed. This should not happen.")
    }

    return { success: true, data: updatedOrder }
  } catch (error) {
    console.error("Exception updating order status:", error)
    return { success: false, error }
  }
}

// CSV Export/Import
export function generateStockCsv(items: StockItem[]): string {
  const headers = [
    "Name",
    "Part Reference",
    "Quantity",
    "Unit Selling Price",
    "Unit Purchase Price",
    "Product Link",
    "Product Description",
    "Category",
    "Minimum Quantity To Order",
    "Supplier ID",
  ]

  const rows = items.map((item) => [
    item.name,
    item.part_reference || "",
    item.quantity.toString(),
    item.unit_selling_price?.toString() || "",
    item.unit_purchase_price?.toString() || "",
    item.product_link || "",
    item.product_description || "",
    item.category || "",
    item.minimum_quantity_to_order?.toString() || "",
    item.supplier_id || "",
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export function generateSuppliersCsv(suppliers: Supplier[]): string {
  const headers = [
    "Name",
    "Phone Number",
    "Email",
    "Recommended Vehicle Make",
    "Address",
    "Website",
    "Speciality",
    "Rank Item",
  ]

  const rows = suppliers.map((supplier) => [
    supplier.name,
    supplier.phone_number || "",
    supplier.email || "",
    supplier.recommended_vehicle_make?.join("|") || "",
    supplier.address || "",
    supplier.website || "",
    supplier.speciality?.join("|") || "",
    supplier.rank_item?.toString() || "",
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}
