import { supabase } from "@/lib/supabase"

export interface Vehicle {
  id?: string
  customer_id: string
  vin?: string
  make: string
  model: string
  model_year?: number
  license_plate?: string
  vehicle_type?: "Luxury" | "Commercial" | "Basic"
  vehicle_category?: "SUV" | "Sedan" | "Truck" | "Van" | "Motorcycle" | "Other"
  engine_type?: "Internal Combustion Engine" | "Electric Motor" | "Hybrid Engine"
  fuel_type?: "Gasoline" | "Diesel" | "Electricity" | "Petrol + Electricity"
  transmission_type?: "Manual" | "Automatic" | "CVT"
  mileage?: number
  mileage_unit?: "km" | "miles"
  logo_image?: string | null
  status?: string
  last_appointment_date?: string | null
  created_at?: string
  updated_at?: string
  // Include customer information for joined queries
  customer?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
  }
}

export async function getVehicles(
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder: "asc" | "desc" = "desc",
  filter?: string,
): Promise<{ data: Vehicle[]; count: number; error: any }> {
  try {
    // Build the query
    let query = supabase
      .from("vehicles")
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
        { count: "exact" },
      )
      .eq("status", "active")

    // Apply filter if provided
    if (filter) {
      query = query.or(
        `make.ilike.%${filter}%,model.ilike.%${filter}%,license_plate.ilike.%${filter}%,vin.ilike.%${filter}%`,
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
    console.error("Error fetching vehicles:", error)
    return { data: [], count: 0, error }
  }
}

export async function getVehicleById(id: string): Promise<{ data: Vehicle | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("vehicles")
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
      .eq("id", id)
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error fetching vehicle by ID:", error)
    return { data: null, error }
  }
}

export async function getVehiclesByCustomerId(customerId: string): Promise<{ data: Vehicle[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("customer_id", customerId)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    return { data: data || [], error }
  } catch (error) {
    console.error("Error fetching vehicles by customer ID:", error)
    return { data: [], error }
  }
}

export async function createVehicle(vehicle: Vehicle): Promise<{ data: Vehicle | null; error: any }> {
  try {
    const { data, error } = await supabase.from("vehicles").insert([vehicle]).select().single()

    return { data, error }
  } catch (error) {
    console.error("Error creating vehicle:", error)
    return { data: null, error }
  }
}

export async function updateVehicle(
  id: string,
  vehicle: Partial<Vehicle>,
): Promise<{ data: Vehicle | null; error: any }> {
  try {
    const { data, error } = await supabase.from("vehicles").update(vehicle).eq("id", id).select().single()

    return { data, error }
  } catch (error) {
    console.error("Error updating vehicle:", error)
    return { data: null, error }
  }
}

export async function deactivateVehicle(id: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("vehicles").update({ status: "disabled" }).eq("id", id)

    return { success: !error, error }
  } catch (error) {
    console.error("Error deactivating vehicle:", error)
    return { success: false, error }
  }
}

export async function uploadVehicleImage(vehicleId: string, file: File): Promise<{ url: string | null; error: any }> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${vehicleId}/logo.${fileExt}`
    const filePath = `vehicles/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("vehicle-images")
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from("vehicle-images").getPublicUrl(filePath)

    return { url: data.publicUrl, error: null }
  } catch (error) {
    console.error("Error uploading vehicle image:", error)
    return { url: null, error }
  }
}

export async function getVehicleMakes(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("vehicles").select("make").order("make")

    if (error) {
      throw error
    }

    // Extract unique makes
    const uniqueMakes = [...new Set(data.map((item) => item.make))]
    return uniqueMakes
  } catch (error) {
    console.error("Error fetching vehicle makes:", error)
    return []
  }
}

export async function getVehicleModelsByMake(make: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("vehicles").select("model").eq("make", make).order("model")

    if (error) {
      throw error
    }

    // Extract unique models
    const uniqueModels = [...new Set(data.map((item) => item.model))]
    return uniqueModels
  } catch (error) {
    console.error("Error fetching vehicle models:", error)
    return []
  }
}
