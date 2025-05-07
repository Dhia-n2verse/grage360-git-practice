import { supabase } from "@/lib/supabase"

export interface RepairItem {
  id?: string
  repair_id?: string
  stock_item_id: string
  quantity: number
  unit_price: number
  total_price: number
  stock_item?: {
    name: string
    part_reference?: string
    category?: string
  }
}

// Update the Repair interface to include notify_customer field
export interface Repair {
  id?: string
  vehicle_id: string
  customer_id: string
  diagnostics_id?: string
  technician_specialty_id?: string
  progress: number
  status: "Scheduled" | "InProgress" | "Pending" | "Completed" | "Cancelled"
  description?: string
  notes?: string
  labor_cost: number
  total_cost?: number
  notify_customer: boolean
  created_at?: string
  updated_at?: string
  vehicle?: {
    make: string
    model: string
    license_plate?: string
    model_year?: number
  }
  customer?: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }
  diagnostic?: {
    id: string
    observation?: string
    recommendation?: string
  }
  repair_items?: RepairItem[]
  technician_specialty?: {
    id: string
    specialty: {
      id: string
      name: string
    }
    technician: {
      id: string
      full_name: string
    }
  }
}

export interface RepairFilter {
  status?: string
  customer_id?: string
  vehicle_id?: string
  search?: string
}

// Enhance the createRepair function with better error handling and debugging
export async function createRepair(repair: Repair): Promise<{ success: boolean; error?: any; id?: string }> {
  try {
    // Ensure required fields are present
    if (!repair.vehicle_id || !repair.customer_id) {
      return {
        success: false,
        error: "Vehicle and customer are required",
      }
    }

    // Calculate total cost properly
    const partsCost = (repair.repair_items || []).reduce((total, item) => total + (item.total_price || 0), 0)
    const totalCost = (repair.labor_cost || 0) + partsCost

    // Prepare the repair data with proper type handling
    const repairData = {
      vehicle_id: repair.vehicle_id,
      customer_id: repair.customer_id,
      diagnostics_id: repair.diagnostics_id || null,
      technician_specialty_id: repair.technician_specialty_id || null,
      progress: repair.progress || 0,
      status: repair.status || "Scheduled",
      description: repair.description || null,
      notes: repair.notes || null,
      labor_cost: repair.labor_cost || 0,
      total_cost: totalCost || 0,
      notify_customer: repair.notify_customer || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Creating repair with data:", JSON.stringify(repairData, null, 2))

    const { data, error } = await supabase.from("repairs").insert(repairData).select("id").single()

    if (error) {
      console.error("Supabase error details:", JSON.stringify(error, null, 2))
      return {
        success: false,
        error: `Database error: ${error.message || JSON.stringify(error)}`,
        details: error,
      }
    }

    if (!data || !data.id) {
      return {
        success: false,
        error: "Failed to create repair: No ID returned",
      }
    }

    return {
      success: true,
      id: data.id,
    }
  } catch (error) {
    console.error("Error creating repair:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    console.error("Error details:", JSON.stringify(error, null, 2))
    return {
      success: false,
      error: `Exception: ${errorMessage}`,
    }
  }
}

// Update the getRepairs function to fetch technician data
export async function getRepairs(
  page = 1,
  pageSize = 10,
  filter: RepairFilter = {},
  sortBy = "created_at",
  sortOrder: "asc" | "desc" = "desc",
): Promise<{ data: Repair[]; count: number }> {
  try {
    const offset = (page - 1) * pageSize

    let query = supabase.from("repairs").select(
      `
        *,
        vehicle:vehicle_id(id, make, model, license_plate, model_year),
        customer:customer_id(id, first_name, last_name, email, phone),
        diagnostic:diagnostics_id(id, observation, recommendation),
        technician_specialty:technician_specialty_id(
          id,
          specialty:specialty_id(id, name),
          technician:technician_id(id, full_name)
        )
      `,
      { count: "exact" },
    )

    // Apply filters
    if (filter.status) {
      query = query.eq("status", filter.status)
    }

    if (filter.customer_id) {
      query = query.eq("customer_id", filter.customer_id)
    }

    if (filter.vehicle_id) {
      query = query.eq("vehicle_id", filter.vehicle_id)
    }

    if (filter.search) {
      query = query.or(
        `description.ilike.%${filter.search}%,notes.ilike.%${filter.search}%,vehicle.license_plate.ilike.%${filter.search}%`,
      )
    }

    // Apply sorting and pagination
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return { data: data || [], count: count || 0 }
  } catch (error) {
    console.error("Error fetching repairs:", error)
    return { data: [], count: 0 }
  }
}

// Update the getRepairById function to fetch technician data
export async function getRepairById(id: string): Promise<Repair | null> {
  try {
    const { data, error } = await supabase
      .from("repairs")
      .select(
        `
        *,
        vehicle:vehicle_id(id, make, model, license_plate, model_year),
        customer:customer_id(id, first_name, last_name, email, phone),
        diagnostic:diagnostics_id(id, observation, recommendation),
        repair_items(
          id, 
          stock_item_id, 
          quantity, 
          unit_price, 
          total_price,
          stock_item:stock_item_id(id, name, part_reference, category)
        ),
        technician_specialty:technician_specialty_id(
          id,
          specialty:specialty_id(id, name),
          technician:technician_id(id, full_name)
        )
      `,
      )
      .eq("id", id)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error fetching repair by ID:", error)
    return null
  }
}

// Update the updateRepair function to track progress changes
export async function updateRepair(id: string, repair: Partial<Repair>): Promise<{ success: boolean; error?: any }> {
  try {
    // Get the current repair to compare progress
    let currentRepair: Repair | null = null

    if (repair.progress !== undefined || repair.status !== undefined) {
      const { data } = await supabase.from("repairs").select("progress, status").eq("id", id).single()

      if (data) {
        currentRepair = data as Repair
      }
    }

    const { error } = await supabase
      .from("repairs")
      .update({ ...repair, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error updating repair:", error)
    return { success: false, error }
  }
}

// Delete a repair
export async function deleteRepair(id: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.from("repairs").delete().eq("id", id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error deleting repair:", error)
    return { success: false, error }
  }
}

// Add a repair item
export async function addRepairItem(repairItem: RepairItem): Promise<{ success: boolean; error?: any; id?: string }> {
  try {
    // Calculate total price
    repairItem.total_price = repairItem.unit_price * repairItem.quantity

    // Remove stock_item property if it exists as it's not in the database schema
    const { stock_item, ...repairItemForDb } = repairItem as any

    const { data, error } = await supabase.from("repair_items").insert(repairItemForDb).select("id").single()

    if (error) {
      console.error("Supabase error adding repair item:", error)
      return {
        success: false,
        error: error.message || "Database error when adding repair item",
      }
    }

    // Update stock quantity
    try {
      await supabase.rpc("decrease_stock_quantity", {
        item_id: repairItem.stock_item_id,
        quantity_to_decrease: repairItem.quantity,
      })
    } catch (stockError) {
      console.error("Error updating stock quantity:", stockError)
      // Even if stock update fails, we return success for the item addition
      // but log the error for debugging
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error("Error adding repair item:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred when adding repair item",
    }
  }
}

// Update a repair item
export async function updateRepairItem(
  id: string,
  repairItem: Partial<RepairItem>,
): Promise<{ success: boolean; error?: any }> {
  try {
    // If quantity is being updated, recalculate total price
    if (repairItem.quantity !== undefined && repairItem.unit_price !== undefined) {
      repairItem.total_price = repairItem.unit_price * repairItem.quantity
    }

    const { error } = await supabase.from("repair_items").update(repairItem).eq("id", id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error updating repair item:", error)
    return { success: false, error }
  }
}

// Delete a repair item
export async function deleteRepairItem(id: string): Promise<{ success: boolean; error?: any }> {
  try {
    // Get the repair item to restore stock quantity
    const { data: repairItem } = await supabase
      .from("repair_items")
      .select("stock_item_id, quantity")
      .eq("id", id)
      .single()

    const { error } = await supabase.from("repair_items").delete().eq("id", id)

    if (error) throw error

    // Restore stock quantity
    if (repairItem) {
      await supabase.rpc("increase_stock_quantity", {
        item_id: repairItem.stock_item_id,
        quantity_to_increase: repairItem.quantity,
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting repair item:", error)
    return { success: false, error }
  }
}

// Get approved diagnostics for dropdown
export async function getApprovedDiagnostics(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("diagnostics")
      .select(
        `
        id, 
        observation, 
        recommendation,
        vehicle:vehicle_id(id, make, model, license_plate),
        customer:customer_id(id, first_name, last_name)
      `,
      )
      .eq("status", "Approved")
      .order("created_at", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error fetching approved diagnostics:", error)
    return []
  }
}

// Calculate repair total cost
export function calculateRepairTotalCost(laborCost: number, repairItems: RepairItem[]): number {
  // Ensure we're working with numbers
  const laborCostNum = Number(laborCost) || 0

  // Calculate parts cost by summing all item total prices
  const partsCost = repairItems.reduce((total, item) => {
    const itemTotal = Number(item.total_price) || 0
    return total + itemTotal
  }, 0)

  // Calculate total and round to 2 decimal places to avoid floating point issues
  const total = Math.round((laborCostNum + partsCost) * 100) / 100

  return total
}
