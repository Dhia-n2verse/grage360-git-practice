import { supabase } from "@/lib/supabase"

export interface ErrorCode {
  code: string
  related_system:
    | "Engine"
    | "Transmission"
    | "Brakes"
    | "Electrical"
    | "Suspension"
    | "Exhaust"
    | "Fuel System"
    | "Cooling System"
    | "Steering"
    | "HVAC"
  severity: "Low" | "Moderate" | "High" | "Critical"
  recommendation: string
}

export interface Diagnostic {
  id?: string
  customer_id: string
  vehicle_id: string
  system_checks: string[]
  error_codes: ErrorCode[]
  observation?: string
  recommendation?: string
  status?: "Pending" | "Approved" | "Rejected"
  created_at?: string
  updated_at?: string
  // Include customer and vehicle information for joined queries
  customer?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  vehicle?: {
    id: string
    make: string
    model: string
    model_year?: number
    license_plate?: string
  }
}

export const SYSTEM_CHECKS = [
  "Engine",
  "Transmission",
  "Brakes",
  "Electrical",
  "Suspension",
  "Exhaust",
  "Fuel System",
  "Cooling System",
  "Steering",
  "HVAC",
] as const

export const SEVERITY_LEVELS = ["Low", "Moderate", "High", "Critical"] as const

export async function getDiagnostics(
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder: "asc" | "desc" = "desc",
  filter?: string,
  status?: string,
): Promise<{ data: Diagnostic[]; count: number; error: any }> {
  try {
    // Build the query
    let query = supabase.from("diagnostics").select(
      `
        *,
        customer:customer_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        vehicle:vehicle_id (
          id,
          make,
          model,
          model_year,
          license_plate
        )
      `,
      { count: "exact" },
    )

    // Apply status filter if provided
    if (status) {
      query = query.eq("status", status)
    }

    // Apply text filter if provided
    if (filter) {
      query = query.or(
        `vehicle.make.ilike.%${filter}%,vehicle.model.ilike.%${filter}%,vehicle.license_plate.ilike.%${filter}%,customer.first_name.ilike.%${filter}%,customer.last_name.ilike.%${filter}%,id.ilike.%${filter}%,observation.ilike.%${filter}%,recommendation.ilike.%${filter}%`,
      )
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" })

    // Apply pagination
    if (page && limit) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    return {
      data: data || [],
      count: count || 0,
      error,
    }
  } catch (error) {
    console.error("Error fetching diagnostics:", error)
    return { data: [], count: 0, error }
  }
}

export async function getDiagnosticById(id: string): Promise<{ data: Diagnostic | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("diagnostics")
      .select(
        `
        *,
        customer:customer_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        vehicle:vehicle_id (
          id,
          make,
          model,
          model_year,
          license_plate
        )
      `,
      )
      .eq("id", id)
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error fetching diagnostic by ID:", error)
    return { data: null, error }
  }
}

export async function getDiagnosticsByCustomerId(customerId: string): Promise<{ data: Diagnostic[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from("diagnostics")
      .select(
        `
        *,
        vehicle:vehicle_id (
          id,
          make,
          model,
          model_year,
          license_plate
        )
      `,
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })

    return { data: data || [], error }
  } catch (error) {
    console.error("Error fetching diagnostics by customer ID:", error)
    return { data: [], error }
  }
}

export async function getDiagnosticsByVehicleId(vehicleId: string): Promise<{ data: Diagnostic[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from("diagnostics")
      .select(
        `
        *,
        customer:customer_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `,
      )
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false })

    return { data: data || [], error }
  } catch (error) {
    console.error("Error fetching diagnostics by vehicle ID:", error)
    return { data: [], error }
  }
}

export async function createDiagnostic(diagnostic: Diagnostic): Promise<{ data: Diagnostic | null; error: any }> {
  try {
    const { data, error } = await supabase.from("diagnostics").insert([diagnostic]).select().single()

    return { data, error }
  } catch (error) {
    console.error("Error creating diagnostic:", error)
    return { data: null, error }
  }
}

export async function updateDiagnostic(
  id: string,
  diagnostic: Partial<Diagnostic>,
): Promise<{ data: Diagnostic | null; error: any }> {
  try {
    const { data, error } = await supabase.from("diagnostics").update(diagnostic).eq("id", id).select().single()

    return { data, error }
  } catch (error) {
    console.error("Error updating diagnostic:", error)
    return { data: null, error }
  }
}

export async function deleteDiagnostic(id: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("diagnostics").delete().eq("id", id)

    return { success: !error, error }
  } catch (error) {
    console.error("Error deleting diagnostic:", error)
    return { success: false, error }
  }
}

export async function updateDiagnosticStatus(
  id: string,
  status: "Pending" | "Approved" | "Rejected",
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("diagnostics").update({ status }).eq("id", id)

    return { success: !error, error }
  } catch (error) {
    console.error("Error updating diagnostic status:", error)
    return { success: false, error }
  }
}
